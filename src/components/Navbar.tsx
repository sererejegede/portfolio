import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/assets/logo.png'
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="#home" className="flex items-center gap-2 text-xl font-headline font-semibold text-primary">
          <Image src={Logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <div className="hidden space-x-2 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href} className="font-medium text-foreground hover:text-primary">
                {link.label}
              </Link>
            </Button>
          ))}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
