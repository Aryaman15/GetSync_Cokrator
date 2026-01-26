import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditTaskForm from "./edit-task-form";
import { TaskType } from "@/types/api.type";

const EditTaskDialog = ({
  task,
  isOpen,
  onClose,
}: { task: TaskType; isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog
      modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose(); // close only when needed
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-auto my-5 border-0">
        <EditTaskForm task={task} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;