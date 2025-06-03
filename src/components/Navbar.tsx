"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/assets/logo.png'
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`md:sticky top-0 z-50 w-full dark:bg-[#131528] backdrop-blur-md transition-shadow duration-200 ${isScrolled ? 'shadow-lg' : ''}`}>
      <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="#home" className="flex items-center gap-2 text-xl font-headline font-semibold text-primary">
          <Image src={Logo} alt="Logo" className="h-7 w-7" />
        </Link>
        <div className="flex">
          <div className="hidden space-x-2 md:flex">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" asChild>
                <Link href={link.href} className="font-medium text-foreground hover:text-primary">
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
