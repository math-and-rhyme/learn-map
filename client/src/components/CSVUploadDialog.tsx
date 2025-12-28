import { useState, useRef, useEffect } from "react";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface CSVUploadDialogProps {
  roadmapId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVUploadDialog({ roadmapId, open, onOpenChange }: CSVUploadDialogProps) {
  const [csvContent, setCsvContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset the content when the dialog is closed
  useEffect(() => {
    if (!open) {
      setCsvContent("");
    }
  }, [open]);

  const csvTemplate = `title,type,timeEstimate,status,parentTitle,topic,resourceUrl,content
Introduction,article,30,not_started,,Welcome,https://example.com,Welcome to the course
HTML Basics,video,45,not_started,Introduction,HTML,https://example.com/html,Learn HTML fundamentals
CSS Fundamentals,article,60,not_started,Introduction,CSS,https://example.com/css,Learn CSS basics
JavaScript Basics,course,120,not_started,Introduction,JavaScript,https://example.com/js,Learn JavaScript essentials
Build Portfolio,project,180,in_progress,JavaScript,Project,https://example.com/portfolio,Build a portfolio website`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setCsvContent(text);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const node: any = { roadmapId };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'title':
            node.title = value;
            break;
          case 'type':
            node.type = value || 'article';
            break;
          case 'timeestimate':
          case 'time_estimate':
            node.timeEstimate = Math.max(0, parseInt(value) || 0);
            break;
          case 'status':
            node.status = value || 'not_started';
            break;
          case 'parenttitle':
          case 'parent_title':
            node.parentTitle = value;
            break;
          case 'topic':
            node.topic = value;
            break;
          case 'resourceurl':
          case 'resource_url':
          case 'url':
            node.resourceUrl = value;
            break;
          case 'content':
          case 'notes':
            node.content = value;
            break;
        }
      });
      
      return node;
    });
  };

  // const handleUpload = async () => {
  //   if (!csvContent.trim()) {
  //     toast({
  //       title: "No content",
  //       description: "Please paste CSV content or upload a file",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsUploading(true);
  //   try {
  //     const nodes = parseCSV(csvContent);
      
  //     const response = await fetch(`/api/roadmaps/${roadmapId}/nodes/batch`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(nodes),
  //       credentials: "include",
  //     });

  //     if (!response.ok) throw new Error("Upload failed");
      
  //     const result = await response.json();
      
  //     toast({
  //       title: "Success!",
  //       description: `Created ${result.count} nodes`,
  //     });
      
  //     // Refresh data
  //     queryClient.invalidateQueries({ queryKey: ['nodes', roadmapId] });
  //     onOpenChange(false); // Close the dialog
      
  //   } catch (error) {
  //     toast({
  //       title: "Upload failed",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };
  const handleUpload = async () => {
    if (!csvContent.trim()) {
      toast({
        title: "No content",
        description: "Please paste CSV content or upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const nodes = parseCSV(csvContent);
      console.log("Uploading", nodes.length, "nodes");
      
      // Use batch endpoint
      const response = await fetch(`/api/roadmaps/${roadmapId}/nodes/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nodes),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Upload result:", result);
      
      toast({
        title: "Success!",
        description: `Created ${result.count} nodes`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['nodes', roadmapId] });
      onOpenChange(false);
      setCsvContent("");
      
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to import nodes",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learnmap-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Nodes from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">CSV Content</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
                  <Download className="h-3 w-3" />
                  Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Upload File
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.txt"
                className="hidden"
              />
            </div>
            <Textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste CSV content here or upload a file"
              className="min-h-[200px] font-mono text-sm"
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              CSV format: title, type, timeEstimate, status, parentTitle, topic, resourceUrl, content
            </p>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Tips:</strong></p>
            <p>• Leave parentTitle empty for root-level nodes</p>
            <p>• Use parentTitle to create hierarchical relationships</p>
            <p>• Types: article, video, book, course, project, other</p>
            <p>• Status: not_started, in_progress, completed</p>
            <p>• timeEstimate is in minutes (e.g., 60 = 1 hour)</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !csvContent.trim()}>
              {isUploading ? "Importing..." : "Import Nodes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// import { useState, useRef } from "react";
// import { Upload, Download, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { useQueryClient } from "@tanstack/react-query";

// interface CSVUploadDialogProps {
//   roadmapId: number;
// }

// export function CSVUploadDialog({ roadmapId }: CSVUploadDialogProps) {
//   const [open, setOpen] = useState(false);
//   const [csvContent, setCsvContent] = useState("");
//   const [isUploading, setIsUploading] = useState(false);
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const csvTemplate = `title,type,timeEstimate,status,parentTitle,topic,resourceUrl,content
// Introduction,article,30,not_started,,Welcome,https://example.com,Welcome to the course
// HTML Basics,video,45,not_started,Introduction,HTML,https://example.com/html,Learn HTML fundamentals
// CSS Fundamentals,article,60,not_started,Introduction,CSS,https://example.com/css,Learn CSS basics
// JavaScript Basics,course,120,not_started,Introduction,JavaScript,https://example.com/js,Learn JavaScript essentials
// Build Portfolio,project,180,in_progress,JavaScript,Project,https://example.com/portfolio,Build a portfolio website`;

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     try {
//       const text = await file.text();
//       setCsvContent(text);
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to read file",
//         variant: "destructive",
//       });
//     }
//   };

//   const parseCSV = (text: string) => {
//     const lines = text.split('\n').filter(line => line.trim() !== '');
//     if (lines.length < 2) return [];

//     const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
//     return lines.slice(1).map(line => {
//       const values = line.split(',').map(v => v.trim());
//       const node: any = { roadmapId };
      
//       headers.forEach((header, index) => {
//         const value = values[index] || '';
        
//         switch (header) {
//           case 'title':
//             node.title = value;
//             break;
//           case 'type':
//             node.type = value || 'article';
//             break;
//           case 'timeestimate':
//           case 'time_estimate':
//             node.timeEstimate = Math.max(0, parseInt(value) || 0);
//             break;
//           case 'status':
//             node.status = value || 'not_started';
//             break;
//           case 'parenttitle':
//           case 'parent_title':
//             node.parentTitle = value;
//             break;
//           case 'topic':
//             node.topic = value;
//             break;
//           case 'resourceurl':
//           case 'resource_url':
//           case 'url':
//             node.resourceUrl = value;
//             break;
//           case 'content':
//           case 'notes':
//             node.content = value;
//             break;
//         }
//       });
      
//       return node;
//     });
//   };

//   const handleUpload = async () => {
//     if (!csvContent.trim()) {
//       toast({
//         title: "No content",
//         description: "Please paste CSV content or upload a file",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsUploading(true);
//     try {
//       const nodes = parseCSV(csvContent);
      
//       const response = await fetch(`/api/roadmaps/${roadmapId}/nodes/batch`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(nodes),
//         credentials: "include",
//       });

//       if (!response.ok) throw new Error("Upload failed");
      
//       const result = await response.json();
      
//       toast({
//         title: "Success!",
//         description: `Created ${result.count} nodes`,
//       });
      
//       // Refresh data
//       queryClient.invalidateQueries({ queryKey: ['nodes', roadmapId] });
//       setOpen(false);
//       setCsvContent("");
      
//     } catch (error) {
//       toast({
//         title: "Upload failed",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const downloadTemplate = () => {
//     const blob = new Blob([csvTemplate], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'learnmap-template.csv';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="outline" size="sm" className="gap-2">
//           <Upload className="h-4 w-4" />
//           Import CSV
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Import Nodes from CSV</DialogTitle>
//         </DialogHeader>
        
//         <div className="space-y-4">
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <label className="text-sm font-medium">CSV Content</label>
//               <div className="flex gap-2">
//                 <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
//                   <Download className="h-3 w-3" />
//                   Template
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={() => fileInputRef.current?.click()}
//                   className="gap-1"
//                 >
//                   <Upload className="h-3 w-3" />
//                   Upload File
//                 </Button>
//               </div>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleFileUpload}
//                 accept=".csv,.txt"
//                 className="hidden"
//               />
//             </div>
//             <Textarea
//               value={csvContent}
//               onChange={(e) => setCsvContent(e.target.value)}
//               placeholder="Paste CSV content here or upload a file"
//               className="min-h-[200px] font-mono text-sm"
//               rows={10}
//             />
//             <p className="text-xs text-muted-foreground">
//               CSV format: title, type, timeEstimate, status, parentTitle, topic, resourceUrl, content
//             </p>
//           </div>

//           <div className="text-sm text-muted-foreground space-y-1">
//             <p><strong>Tips:</strong></p>
//             <p>• Leave parentTitle empty for root-level nodes</p>
//             <p>• Use parentTitle to create hierarchical relationships</p>
//             <p>• Types: article, video, book, course, project, other</p>
//             <p>• Status: not_started, in_progress, completed</p>
//             <p>• timeEstimate is in minutes (e.g., 60 = 1 hour)</p>
//           </div>

//           <div className="flex justify-end gap-2 pt-4">
//             <Button variant="outline" onClick={() => setOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleUpload} disabled={isUploading || !csvContent.trim()}>
//               {isUploading ? "Importing..." : "Import Nodes"}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }