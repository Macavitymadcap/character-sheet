import { raw } from "hono/html";
import { appStyles } from "../../styles";

interface LayoutProps {
  children: unknown;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  return (
    <html lang="en-GB">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <script src="https://unpkg.com/htmx.org@1.9.12"></script>
        <style>{raw(appStyles)}</style>
      </head>
      <body>{children}</body>
    </html>
  );
};
