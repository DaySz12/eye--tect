export const metadata = { title: "Iris Login Demo", description: "Eye-based login demo" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
