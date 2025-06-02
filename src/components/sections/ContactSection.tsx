import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Github, Linkedin, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function ContactSection() {
  return (
    <Card className="bg-card shadow-xl max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <h2 className="font-headline text-4xl font-bold text-primary">Get In Touch</h2>
        <CardDescription className="text-muted-foreground text-lg pt-2">
          I&apos;m always open to discussing new projects, creative ideas, or opportunities to be part of your visions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="mailto:john.doe@example.com">
              <Mail className="mr-2 h-5 w-5" /> Email Me
            </a>
          </Button>
           <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/10">
            <a href="tel:+1234567890">
              <Smartphone className="mr-2 h-5 w-5" /> Call Me (Optional)
            </a>
          </Button>
        </div>
        <div className="flex justify-center space-x-6 pt-4">
          <Link href="https://github.com/johndoe" target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile">
            <Github className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
          <Link href="https://linkedin.com/in/johndoe" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile">
            <Linkedin className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
