interface SettingsPageHeadingProps {
  title: string;
  subtitle?: string;
}

export function SettingsPageHeading({ title, subtitle }: SettingsPageHeadingProps) {
  return (
    <div className="mb-7">
      <h1 className="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.5px] text-text-default">
        {title}
      </h1>
      {subtitle ? (
        <div className="mt-1 text-[13px] text-text-muted">{subtitle}</div>
      ) : null}
    </div>
  );
}
