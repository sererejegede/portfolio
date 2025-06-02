import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutSection() {
  return (
    <div className="grid md:grid-cols-5 gap-12 items-center">
      <div className="md:col-span-2">
        <Card className="overflow-hidden shadow-xl">
          <Image
            src="https://placehold.co/600x600.png"
            alt="John Doe - Professional Photo"
            width={600}
            height={600}
            className="object-cover w-full h-full"
            data-ai-hint="professional portrait"
          />
        </Card>
      </div>
      <div className="md:col-span-3">
        <h2 className="font-headline text-4xl font-bold text-primary mb-6">About Me</h2>
        <div className="space-y-4 text-lg text-foreground/90">
          <p>
            Hello! I&apos;m John, a dedicated Frontend Developer with over 5 years of experience in creating dynamic and responsive web applications. My journey in web development started with a fascination for how code transforms into interactive digital experiences, and that curiosity continues to drive me today.
          </p>
          <p>
            I specialize in JavaScript, TypeScript, and modern frontend frameworks like React, Vue, and Next.js. I&apos;m passionate about writing clean, efficient, and maintainable code, and I strongly believe in the power of good design to enhance usability.
          </p>
          <p>
            When I&apos;m not coding, you can find me exploring new technologies, contributing to open-source projects, or enjoying a good cup of coffee. I&apos;m always eager to take on new challenges and collaborate on exciting projects.
          </p>
        </div>
      </div>
    </div>
  );
}
