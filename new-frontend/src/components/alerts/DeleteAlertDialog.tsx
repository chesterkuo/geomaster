import { useMutation } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertConfiguration, alertsApi } from '@/lib/api/alerts';
import { toast } from 'sonner';

interface DeleteAlertDialogProps {
  alert: AlertConfiguration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteAlertDialog({ alert, open, onOpenChange, onSuccess }: DeleteAlertDialogProps) {
  const deleteMutation = useMutation({
    mutationFn: alertsApi.deleteAlert,
    onSuccess: () => {
      toast.success('Alert configuration deleted successfully');
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete alert: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleDelete = () => {
    if (!alert) return;
    deleteMutation.mutate(alert.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Alert Configuration</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the alert configuration "{alert?.name}"? 
            This action cannot be undone and will stop all monitoring for this alert.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Alert'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}