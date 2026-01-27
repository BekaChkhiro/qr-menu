export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Digital Menu
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          QR Code Menu Management for Cafes and Restaurants
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/admin/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </a>
          <a
            href="/login"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}
