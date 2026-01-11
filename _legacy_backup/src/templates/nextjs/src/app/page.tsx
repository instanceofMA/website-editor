import Link from "next/link";
import { ArrowRight, Check, Shield, Database, Zap } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-slate-800 p-4 sticky top-0 bg-slate-900/80 backdrop-blur-md z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
                            N
                        </div>
                        <span className="font-bold text-xl">NextSaaS</span>
                    </div>
                    <nav className="flex gap-6 text-sm text-slate-400 font-medium">
                        <Link
                            href="#features"
                            className="hover:text-white transition"
                        >
                            Features
                        </Link>
                        <Link
                            href="#pricing"
                            className="hover:text-white transition"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="#docs"
                            className="hover:text-white transition"
                        >
                            Docs
                        </Link>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero */}
                <section className="py-20 px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-8 border border-blue-500/20">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                        NEXT.JS 15 READY
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                        Build faster with <br className="hidden md:block" />
                        <span className="text-blue-500">
                            Modern Architecture
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The comprehensive starter kit for high-performance React
                        applications. Includes everything you need to launch
                        your next big idea.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                            Get Started Now <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition border border-slate-700">
                            View on GitHub
                        </button>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 bg-slate-800/20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={
                                    <Zap className="w-6 h-6 text-amber-400" />
                                }
                                title="Lightning Fast"
                                description="Built on the edge with server components for sub-millisecond load times."
                            />
                            <FeatureCard
                                icon={
                                    <Shield className="w-6 h-6 text-emerald-400" />
                                }
                                title="Secure Auth"
                                description="Enterprise-grade authentication with NextAuth.js pre-configured."
                            />
                            <FeatureCard
                                icon={
                                    <Database className="w-6 h-6 text-purple-400" />
                                }
                                title="Prisma ORM"
                                description="Type-safe database access with Postgres connection pooling."
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700 hover:bg-slate-800/60 hover:border-blue-500/30 transition duration-300">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{description}</p>
        </div>
    );
}
