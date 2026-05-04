export const ToggleButton = ({isOn, onToggle, label, onLabel = "on", offLabel = "off", className = ""}) => {
	const classes = [
		"btn",
		isOn ? "btn-primary" : "btn-gray",
		"btn-toggle",
		isOn ? "btn-toggle--on" : "btn-toggle--off",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<button
			type="button"
			aria-pressed={isOn}
			className={classes}
			onClick={onToggle}
		>
			{label}: {isOn ? onLabel : offLabel}
		</button>
	);
};

