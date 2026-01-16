// ACM Logo component (white version)
export function AcmLogo({ className = "" }: { className?: string }) {
	return <img src="/acm_logo.svg" className={`  ${className}`}></img>;
}

// BitByDesign Logo component
export function BitByDesignLogo({ className = "" }: { className?: string }) {
	return <img src="/bbd_logo.svg" className={`  ${className}`}></img>;
}
