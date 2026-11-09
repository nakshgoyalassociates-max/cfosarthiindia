import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { EyeOff } from "lucide-react";

export interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onHideInstead?: () => void;
  hideLabel?: string;
}

export const ConfirmDestructiveDialog: React.FC<ConfirmDestructiveDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onHideInstead,
  hideLabel = "Hide Instead (Keep for Future)",
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-danger font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap gap-2">
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          {onHideInstead && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onHideInstead();
                onOpenChange(false);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{hideLabel}</span>
            </button>
          )}
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
