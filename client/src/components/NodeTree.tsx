import { useState } from "react";
import { type NodeResponse } from "@shared/schema";
import { useUpdateNode, useDeleteNode, useCreateNode } from "@/hooks/use-nodes";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  FileText, 
  Video, 
  GraduationCap, 
  MoreVertical, 
  Plus,
  Trash,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface NodeTreeProps {
  nodes: NodeResponse[];
  roadmapId: number;
  onSelectNode: (node: NodeResponse) => void;
  selectedNodeId?: number;
}

export function NodeTree({ nodes, roadmapId, onSelectNode, selectedNodeId }: NodeTreeProps) {
  // Simple hierarchical sort
  const rootNodes = nodes.filter(n => !n.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));

  const getChildren = (parentId: number) => 
    nodes.filter(n => n.parentId === parentId).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-1">
      {rootNodes.map(node => (
        <NodeItem 
          key={node.id} 
          node={node} 
          roadmapId={roadmapId}
          getChildren={getChildren}
          onSelect={onSelectNode}
          isSelected={selectedNodeId === node.id}
          depth={0}
        />
      ))}
      <AddNodeButton roadmapId={roadmapId} parentId={null} />
    </div>
  );
}

function NodeItem({ 
  node, 
  roadmapId, 
  getChildren, 
  onSelect, 
  isSelected,
  depth 
}: { 
  node: NodeResponse; 
  roadmapId: number;
  getChildren: (id: number) => NodeResponse[];
  onSelect: (node: NodeResponse) => void;
  isSelected: boolean;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const children = getChildren(node.id);
  const hasChildren = children.length > 0;
  
  const { mutate: deleteNode } = useDeleteNode();
  const { mutate: updateStatus } = useUpdateNode();

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = node.status === 'completed' ? 'not_started' : 'completed';
    updateStatus({ 
      id: node.id, 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null
    });
  };

  const Icon = getNodeIcon(node.type);

  return (
    <div className="select-none">
      <div 
        className={cn(
          "group flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors duration-200",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
          depth > 0 && "ml-4 border-l border-border pl-2"
        )}
        onClick={() => onSelect(node)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={cn(
            "p-0.5 rounded-sm hover:bg-black/5 mr-1 transition-transform",
            !hasChildren && "opacity-0 pointer-events-none"
          )}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <button onClick={toggleStatus} className="mr-2 text-muted-foreground hover:text-primary transition-colors">
          {node.status === 'completed' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>

        <Icon className={cn("h-4 w-4 mr-2", isSelected ? "text-primary" : "text-muted-foreground")} />
        
        <span className={cn("text-sm font-medium flex-1 truncate", node.status === 'completed' && "line-through text-muted-foreground")}>
          {node.title}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteNode({ id: node.id, roadmapId }); }}>
              <Trash className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isOpen && (
        <div className="ml-2">
          {children.map(child => (
            <NodeItem 
              key={child.id}
              node={child}
              roadmapId={roadmapId}
              getChildren={getChildren}
              onSelect={onSelect}
              isSelected={isSelected} // Parent selection doesn't cascade visually in this design
              depth={depth + 1}
            />
          ))}
          <AddNodeButton roadmapId={roadmapId} parentId={node.id} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function AddNodeButton({ roadmapId, parentId, depth = 0 }: { roadmapId: number; parentId: number | null; depth?: number }) {
  const { mutate, isPending } = useCreateNode();

  const handleAdd = () => {
    mutate({
      roadmapId,
      data: {
        roadmapId,
        parentId,
        title: "New Item",
        type: "article",
        status: "not_started",
        timeEstimate: 0,
        order: 999
      }
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={cn(
        "w-full justify-start text-muted-foreground hover:text-primary h-8",
        depth > 0 && "ml-4 pl-2 border-l border-transparent"
      )}
      onClick={handleAdd}
      disabled={isPending}
    >
      <Plus className="h-3 w-3 mr-2" />
      <span className="text-xs">{isPending ? "Adding..." : "Add Item"}</span>
    </Button>
  );
}

function getNodeIcon(type: string) {
  switch (type) {
    case 'video': return Video;
    case 'book': return BookOpen;
    case 'course': return GraduationCap;
    case 'article': return FileText;
    default: return Circle;
  }
}
