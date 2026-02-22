"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    Check,
    Code2,
    Github,
    Globe,
    Layers,
    Zap,
    Sparkles,
    Upload,
} from "lucide-react";
import { cn } from "../lib/utils";

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);

        // Intersection Observer for reveal effects
        const observerOptions = {
            threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                }
            });
        }, observerOptions);

        const reveals = document.querySelectorAll(".reveal");
        reveals.forEach((el) => observer.observe(el));

        return () => {
            window.removeEventListener("scroll", handleScroll);
            reveals.forEach((el) => observer.unobserve(el));
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#fcfcfb] text-[#1a1a1a] selection:bg-black selection:text-white overflow-hidden font-sans">
            {/* Custom Cursor/Glow effect */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
            </div>

            {/* Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-size-[50px_50px]" />

            {/* Navigation */}
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-12",
                    scrolled
                        ? "h-16 bg-white/80 backdrop-blur-md border-b"
                        : "h-24",
                )}
            >
                <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
                    <div
                        className="flex items-center group cursor-pointer"
                        onClick={() =>
                            window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                    >
                        <Image
                            src="/click-logo.png"
                            alt="Click_"
                            width={110}
                            height={32}
                            className="h-8 w-auto object-contain mix-blend-multiply"
                            priority
                        />
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        {["Features", "Philosophy", "Showcase"].map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <button className="text-sm rounded-none border-b border-transparent hover:border-black hover:bg-transparent hidden sm:flex items-center gap-2 px-4 py-2">
                            <Upload className="w-4 h-4" /> Import Project
                        </button>
                        <button className="bg-black text-white hover:bg-neutral-800 rounded-none px-6 h-10 font-medium">
                            Get Access
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-40 pb-20 px-6 md:px-12">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full">
                                <span className="flex h-2 w-2 rounded-full bg-black animate-pulse" />
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                                    V1.0 Early Access
                                </span>
                            </div>

                            <h1
                                className="font-heading text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] reveal"
                                data-lid="hero-title"
                            >
                                The Headless
                                <br />
                                Editor for
                                <br />
                                Developers.
                            </h1>

                            <p
                                className="text-xl text-neutral-500 max-w-lg leading-relaxed reveal"
                                data-lid="hero-description"
                            >
                                A "Zero Runtime" visual workspace that maps
                                directly to your code. No bloat. No lock-in.
                                100% Git-synced.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4 reveal">
                                <button className="bg-black text-white hover:bg-neutral-800 h-14 px-8 rounded-none text-base group inline-flex items-center justify-center font-medium">
                                    Launch Live Editor
                                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </button>

                                <div className="flex gap-2">
                                    <button className="h-14 px-6 rounded-none border border-neutral-200 text-sm font-semibold flex items-center gap-2 bg-white hover:bg-neutral-50 transition-colors">
                                        <Upload className="w-4 h-4" /> Start
                                        Importing
                                    </button>
                                    <button className="h-14 px-6 rounded-none border border-neutral-200 text-sm font-semibold flex items-center gap-2 bg-white hover:bg-neutral-50 transition-colors">
                                        <Sparkles className="w-4 h-4 text-yellow-500" />{" "}
                                        Demo Templates
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="relative reveal">
                            <div className="relative aspect-4/3 w-full bg-white border border-neutral-100 shadow-2xl overflow-hidden group">
                                <Image
                                    src="/hero.png"
                                    alt="Click_ Editor Preview"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Overlay UI Elements */}
                                <div className="absolute top-8 left-8 p-4 bg-white/90 backdrop-blur border border-neutral-100 shadow-xl rounded font-mono text-[10px] space-y-1 transform -rotate-2 select-none pointer-events-none hidden md:block">
                                    <div className="text-neutral-400">
                                        // src/components/Hero.tsx
                                    </div>
                                    <div className="text-black">
                                        &lt;h1 className="
                                        <span className="font-bold underline">
                                            text-8xl
                                        </span>
                                        "&gt;
                                    </div>
                                    <div className="pl-4">Click_</div>
                                    <div className="text-black">
                                        &lt;/h1&gt;
                                    </div>
                                </div>

                                <div className="absolute bottom-8 right-8 p-4 bg-white/90 backdrop-blur border border-neutral-100 shadow-xl rounded font-mono text-[10px] space-y-1 transform rotate-2 select-none pointer-events-none hidden md:block">
                                    <div className="text-neutral-400">
                                        /* Tailwind Mapping */
                                    </div>
                                    <div className="text-neutral-600">
                                        flex items-center{" "}
                                        <span className="text-black font-bold">
                                            gap-12
                                        </span>
                                    </div>
                                    <div className="text-neutral-600">
                                        px-8 py-4 bg-black text-white
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -z-10 -top-20 -right-20 w-80 h-80 bg-neutral-100 rounded-full blur-[100px] opacity-50" />
                            <div className="absolute -z-10 -bottom-20 -left-20 w-80 h-80 bg-neutral-200 rounded-full blur-[100px] opacity-30" />
                        </div>
                    </div>
                </section>

                {/* Trusted By Section */}
                <section className="py-20 border-y border-neutral-100">
                    <div className="max-w-7xl mx-auto px-6 md:px-12">
                        <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-12">
                            Built on Next-Gen Tech
                        </p>
                        <div className="flex flex-wrap justify-between items-center gap-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                            {[
                                "Vercel",
                                "Stripe",
                                "StackBlitz",
                                "Neon",
                                "Prisma",
                                "Resend",
                            ].map((brand) => (
                                <span
                                    key={brand}
                                    className="font-heading font-bold text-2xl lowercase tracking-tighter"
                                >
                                    {brand}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Problems/Solution Narrative */}
                <section id="features" className="py-32 px-6 md:px-12 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-24 items-start">
                            <div className="sticky top-40 space-y-6">
                                <h2 className="font-heading text-5xl font-bold tracking-tight">
                                    The visual editor that developers actually
                                    like.
                                </h2>
                                <p className="text-lg text-neutral-500 max-w-md">
                                    Traditional CMSs treat code as a container.
                                    We treat code as the source of truth.
                                </p>
                            </div>

                            <div className="space-y-12">
                                <div className="p-8 border border-neutral-100 bg-[#fcfcfb] group hover:border-black transition-colors duration-500 reveal">
                                    <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-6 text-white transition-transform group-hover:scale-110">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold mb-4">
                                        Zero Runtime Overhead
                                    </h3>
                                    <p className="text-neutral-500 leading-relaxed">
                                        Click_ is a build-time tool. We don't
                                        inject scripts. Your production bundle
                                        remains pure, exactly as you wrote it.
                                    </p>
                                </div>

                                <div className="p-8 border border-neutral-100 bg-[#fcfcfb] group hover:border-black transition-colors duration-500 reveal">
                                    <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-6 text-white transition-transform group-hover:scale-110">
                                        <Code2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold mb-4">
                                        Direct-to-JSX Mapping
                                    </h3>
                                    <p className="text-neutral-500 leading-relaxed">
                                        Our engine analyzes your AST and maps
                                        visual changes directly to React
                                        components. Margin changes become
                                        Tailwind classes.
                                    </p>
                                </div>

                                <div className="p-8 border border-neutral-100 bg-[#fcfcfb] group hover:border-black transition-colors duration-500 reveal">
                                    <div className="w-12 h-12 bg-black rounded flex items-center justify-center mb-6 text-white transition-transform group-hover:scale-110">
                                        <Github className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold mb-4">
                                        Version Control for Content
                                    </h3>
                                    <p className="text-neutral-500 leading-relaxed">
                                        Marketing makes an edit, Click_ creates
                                        a commit. Your engineering team reviews
                                        content changes just like code changes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comparison Section */}
                <section className="py-32 px-6 md:px-12 bg-[#0a0a0a] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.05),transparent_70%)]" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="font-heading text-5xl font-bold tracking-tight">
                                The Industry Comparison
                            </h2>
                            <p className="text-neutral-500 max-w-2xl mx-auto">
                                We're not building another CMS. We're building a
                                new layer for the modern web stack.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-10 border border-white/10 bg-white/5 space-y-8 backdrop-blur-sm">
                                <div className="font-mono text-[10px] uppercase text-neutral-500">
                                    Proprietary
                                </div>
                                <h3 className="text-3xl font-bold font-heading">
                                    Webflow
                                </h3>
                                <div className="space-y-4 text-sm text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" />{" "}
                                        Closed ecosystem
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" />{" "}
                                        Heavy runtime scripts
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" />{" "}
                                        Vendor lock-in
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-2 border-white bg-white text-black space-y-8 shadow-[0_0_50px_rgba(255,255,255,0.2)] transform md:-translate-y-4 relative overflow-hidden">
                                <div className="absolute top-4 right-4">
                                    <Sparkles className="w-6 h-6 opacity-20" />
                                </div>
                                <div className="font-mono text-[10px] uppercase text-neutral-500 font-bold">
                                    The New Standard
                                </div>
                                <h3 className="text-3xl font-bold font-heading">
                                    Click_
                                </h3>
                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 font-bold">
                                        <Check className="w-4 h-4" /> 100% Own
                                        your code
                                    </div>
                                    <div className="flex items-center gap-2 font-bold">
                                        <Check className="w-4 h-4" /> Zero
                                        runtime impact
                                    </div>
                                    <div className="flex items-center gap-2 font-bold">
                                        <Check className="w-4 h-4" /> Works with
                                        ANY framework
                                    </div>
                                    <div className="flex items-center gap-2 font-bold">
                                        <Check className="w-4 h-4" /> Git-native
                                        workflow
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border border-white/10 bg-white/5 space-y-8 backdrop-blur-sm">
                                <div className="font-mono text-[10px] uppercase text-neutral-500">
                                    Traditional
                                </div>
                                <h3 className="text-3xl font-bold font-heading">
                                    Headless CMS
                                </h3>
                                <div className="space-y-4 text-sm text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" />{" "}
                                        Disconnected UI
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" />{" "}
                                        JSON-only editing
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-white rounded-full" />{" "}
                                        Manual mapping required
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Conversion Section */}
                <section className="py-40 px-6 md:px-12 text-center">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <h2 className="font-heading text-6xl md:text-8xl font-bold tracking-tight leading-[0.95] reveal">
                            Ready to ship
                            <br />
                            without limits?
                        </h2>
                        <p
                            className="text-xl text-neutral-500 max-w-lg mx-auto"
                            data-lid="footer-cta-text"
                        >
                            Join 500+ teams building the future of the web with
                            Click_. Start for free today.
                        </p>
                        <div className="flex flex-col items-center gap-6">
                            <button className="bg-black text-white hover:bg-neutral-800 h-16 px-12 rounded-none text-lg group inline-flex items-center justify-center font-medium">
                                Start Your Project
                                <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                            </button>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                No Credit Card Required • Instant Deployment
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="pt-20 pb-12 border-t border-neutral-100">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="grid md:grid-cols-4 gap-12 mb-20">
                        <div className="col-span-2 space-y-6">
                            <div className="flex items-center">
                                <Image
                                    src="/click-logo.png"
                                    alt="Click_"
                                    width={110}
                                    height={32}
                                    className="h-8 w-auto object-contain mix-blend-multiply"
                                />
                            </div>
                            <p className="text-neutral-500 max-w-xs">
                                The world's first headless, framework-agnostic
                                no-code editor designed for technical teams.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-sm">Product</h4>
                            <ul className="space-y-4 text-sm text-neutral-500">
                                <li>
                                    <Link href="#">Features</Link>
                                </li>
                                <li>
                                    <Link href="#">Workflow</Link>
                                </li>
                                <li>
                                    <Link href="#">Pricing</Link>
                                </li>
                                <li>
                                    <Link href="#">Docs</Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-sm">Legal</h4>
                            <ul className="space-y-4 text-sm text-neutral-500">
                                <li>
                                    <Link href="#">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link href="#">Terms of Service</Link>
                                </li>
                                <li>
                                    <Link href="#">Security</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-neutral-100 gap-6">
                        <p className="text-neutral-400 text-xs">
                            © 2026 Click_ Inc. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link
                                href="#"
                                className="p-2 bg-neutral-100 rounded hover:bg-black hover:text-white transition-colors"
                            >
                                <Github className="w-4 h-4" />
                            </Link>
                            <Link
                                href="#"
                                className="p-2 bg-neutral-100 rounded hover:bg-black hover:text-white transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
