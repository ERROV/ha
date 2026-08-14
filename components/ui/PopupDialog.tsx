"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import { Button } from "./button";

type PopupDialogProps = {
  title: string | ReactNode;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  confirmLabel?: string | ReactNode;
  cancelLabel?: string | ReactNode;
  children?: ReactNode;
  isConfirmDisabled?: boolean;
};

const PopupDialog = ({
  title,
  description,
  open,
  onOpenChange,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  children,
}: PopupDialogProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground border border-border rounded-lg shadow-lg p-6 space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <Cross2Icon className="w-4 h-4 text-muted-foreground" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {description && <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>}
          {children}
          <div className="flex justify-end gap-2 pt-4">
            <Dialog.Close asChild>
              <Button variant="outline" type="button">{cancelLabel}</Button>
            </Dialog.Close>
            <Button variant="destructive" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PopupDialog;
