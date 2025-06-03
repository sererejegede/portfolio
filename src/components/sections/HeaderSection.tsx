import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Header from '@/components/ui/header';
import Image from 'next/image';
import HeaderImage from '@/assets/header-image.png';

export default function HeaderSection() {
  return (
    <section id="home" className="relative flex min-h-[calc(100vh-var(--navbar-height,4rem))] items-center justify-center bg-background py-20 text-center">
      <div className="absolute inset-0">
        <Image
          src={HeaderImage}
          alt="Header Image"
          fill
          className="object-cover opacity-30"
        />
      </div>
      <div className="absolute container mx-auto px-4 sm:px-6 lg:px-8">
        <Header level="h1">
          Serere Jegede
        </Header>
        <p className="mt-6 font-headline text-2xl text-primary sm:text-3xl">
          Senior Frontend Developer
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Crafting beautiful, performant, and accessible web experiences with a passion for modern technologies and user-centric design.
        </p>
        <div className="mt-10 flex justify-center gap-x-6">
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="#projects">View My Work</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
            <Link href="#contact">Get In Touch</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
