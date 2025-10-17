"use client";

import { Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
	const pathname = usePathname();

	const navItems = [
		{ href: "/", label: "Home" },
		{ href: "/data", label: "Data Ingestion" },
		{ href: "/strategies", label: "Pricing Strategies" },
		{ href: "/optimization", label: "Optimization" },
	];

	return (
		<header className="border-b bg-white">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					<Link href="/" className="flex items-center gap-2 font-bold text-xl">
						<Zap className="h-6 w-6 text-blue-600"/>
						<span>Energy Price Optimizer</span>
					</Link>

					<nav className="flex gap-6">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`text-sm font-medium transition-colors hover:text-blue-600 ${
									pathname === item.href
										? "text-blue-600"
										: "text-gray-600"
								}`}
							>
								{item.label}
							</Link>
						))}
					</nav>
				</div>
			</div>
		</header>
	);
}
