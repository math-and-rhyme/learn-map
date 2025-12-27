import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoadmapSchema } from "@shared/schema";
import { z } from "zod";
import { useCreateRoadmap } from "@/hooks/use-roadmaps";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

const formSchema = insertRoadmapSchema.pick({
  title: true,
  description: true,
  dailyFocusTime: true,
});

type FormValues = z.infer<typeof formSchema>;

export function CreateRoadmapDialog() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateRoadmap();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dailyFocusTime: 60,
    }
  });

  const onSubmit = (data: FormValues) => {
    mutate({
      ...data,
      dailyFocusTime: Number(data.dailyFocusTime)
    }, {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 transition-all duration-300">
          <Plus className="h-4 w-4" />
          New Roadmap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Roadmap</DialogTitle>
          <DialogDescription>
            Start a new learning journey. Define your goals and available time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Learn React 2024" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="What are your goals?" 
              className="resize-none min-h-[100px]"
              {...register("description")} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyFocusTime">Daily Focus Time (minutes)</Label>
            <Input 
              type="number" 
              id="dailyFocusTime" 
              {...register("dailyFocusTime", { valueAsNumber: true })} 
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Roadmap"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
