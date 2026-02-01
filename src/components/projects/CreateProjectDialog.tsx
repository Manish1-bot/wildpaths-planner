import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useProjects, CreateProjectInput } from '@/hooks/useProjects';

const formSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  region: z.string().optional(),
  species: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (projectId: string) => void;
}

export function CreateProjectDialog({ trigger, onSuccess }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { createProject } = useProjects();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      region: '',
      species: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const input: CreateProjectInput = {
      name: data.name,
      description: data.description,
      region: data.region,
      species: data.species ? data.species.split(',').map((s) => s.trim()) : undefined,
    };

    createProject.mutate(input, {
      onSuccess: (project) => {
        setOpen(false);
        form.reset();
        onSuccess?.(project.id);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading">Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new wildlife corridor planning project. You can add data and run analyses after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Western Ghats Corridor Study" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the goals and scope of this project..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region</FormLabel>
                  <FormControl>
                    <Input placeholder="Western Ghats, Karnataka" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Species</FormLabel>
                  <FormControl>
                    <Input placeholder="Tiger, Elephant, Leopard" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated list of species this project focuses on
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
