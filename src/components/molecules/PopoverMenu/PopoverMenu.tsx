import { Icon } from "../../atoms/Icon";

interface PopoverMenuItem {
  current?: boolean;
  href: string;
  label: string;
}

interface PopoverMenuProps {
  id: string;
  items: PopoverMenuItem[];
  label: string;
}

export const PopoverMenu = ({ id, items, label }: PopoverMenuProps) => {
  const panelId = `${id}-panel`;
  const anchorName = `--${id}-anchor`;
  const anchorStyle = `--popover-anchor-name: ${anchorName};`;

  return (
    <div class="popover-menu" style={anchorStyle}>
      <button
        class="popover-menu-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        popovertarget={panelId}
        popovertargetaction="toggle"
      >
        <Icon name="menu" />
      </button>
      <div id={panelId} class="popover-menu-panel" popover="auto" role="menu">
        {items.map((item) => (
          <a
            class="popover-menu-item"
            href={item.href}
            role="menuitem"
            aria-current={item.current ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
};
