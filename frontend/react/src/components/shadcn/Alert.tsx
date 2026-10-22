import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  childrenBtn: React.ReactNode;
  childrenTitle: React.ReactNode;
  childrenDescription: React.ReactNode;
  continuar: () => void;
}

export function AlertDialogDemo({
  childrenBtn,
  childrenTitle,
  childrenDescription,
  continuar,
}: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{childrenBtn}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{childrenTitle}</AlertDialogTitle>
          <AlertDialogDescription>{childrenDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={continuar}>Aceptar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
