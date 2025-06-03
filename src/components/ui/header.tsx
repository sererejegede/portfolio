import { cn } from "@/lib/utils";

type HeaderProps = {  
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  children: React.ReactNode;
}

export default function Header({ level, className, children, ...props }: HeaderProps) {
  const Tag = level as keyof JSX.IntrinsicElements;
  let classes = 'font-headline font-bold text-primary mb-12 text-center';

  switch (level) {
    case 'h1':
      classes += ' text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl';
      break;
    case 'h2':
      classes += ' text-4xl';
      break;
    case 'h3':
      classes += ' text-3xl font-bold';
      break;
  }
  return <Tag className={cn(classes, className)} {...props}>{children}</Tag>;
}