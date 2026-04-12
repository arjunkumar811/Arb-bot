import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
	return (
		<div
			className={cn(
				"rounded-xl border border-slate-700/80 bg-slate-900/70 text-slate-100 shadow-md",
				className
			)}
			{...props}
		/>
	);
}

export function CardHeader({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
	return <div className={cn("p-6", className)} {...props} />;
}

export function CardTitle({
	className,
	...props
}: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
	return (
		<h3 className={cn("text-base font-semibold", className)} {...props} />
	);
}

export function CardContent({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>): JSX.Element {
	return <div className={cn("px-6 pb-6", className)} {...props} />;
}
