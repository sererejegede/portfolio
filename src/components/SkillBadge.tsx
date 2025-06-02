import type { LucideProps } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SkillBadgeProps {
  name: string;
  icon: React.ElementType<LucideProps>;
}

export default function SkillBadge({ name, icon: Icon }: SkillBadgeProps) {
  return (
    <Card className="bg-card hover:bg-secondary transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg">
      <CardContent className="p-4 flex flex-col items-center justify-center gap-2 aspect-square">
        <Icon className="h-10 w-10 text-primary" />
        <span className="font-medium text-foreground text-center">{name}</span>
      </CardContent>
    </Card>
  );
}
