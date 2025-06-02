import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, ExternalLink } from 'lucide-react';

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  imageUrl: string;
  imageHint: string;
  githubUrl?: string;
  liveDemoUrl?: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg h-full bg-card hover:shadow-primary/20 transition-shadow duration-300">
      <div className="relative w-full h-48 sm:h-56 md:h-64">
        <Image
          src={project.imageUrl}
          alt={project.title}
          fill
          className="object-cover"
          data-ai-hint={project.imageHint}
        />
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">{project.title}</CardTitle>
        <CardDescription className="text-muted-foreground pt-1 h-16 overflow-hidden text-ellipsis">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <h4 className="font-semibold text-sm text-foreground mb-2">Technologies Used:</h4>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="bg-secondary/50 text-secondary-foreground">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-start gap-3 pt-4 border-t border-border/50">
        {project.githubUrl && (
          <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
            <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" /> GitHub
            </Link>
          </Button>
        )}
        {project.liveDemoUrl && (
          <Button variant="default" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={project.liveDemoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
