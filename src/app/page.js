import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white">

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-32 px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          A safe world where your mind can breathe
        </h1>

        <p className="text-lg text-gray-300 max-w-2xl mb-8">
          Connect with AI companions, anonymous peers, and therapeutic tools
          designed for your emotional well-being.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
  <Link href="/login">
    <button className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition">
      Enter Safe Space
    </button>
  </Link>

  <Link href="/anonymous">
    <button className="px-6 py-3 border border-gray-500 rounded-lg hover:border-purple-400 transition">
      Talk Anonymously
    </button>
  </Link>

  <Link href="/avatar">
    <button className="px-6 py-3 border border-gray-500 rounded-lg hover:border-purple-400 transition">
      Create Your Avatar
    </button>
  </Link>
</div>
      </section>

      {/* Features Section */}
      <section className="px-6 pb-24">
        <h2 className="text-3xl font-semibold text-center mb-12">
          Everything you need to feel safe
        </h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            "AI Emotional Companion",
            "Anonymous Human Support",
            "Mood Tracking & Insights",
            "3D Custom Avatars",
            "Stress-Relief Games",
            "Privacy & Encryption",
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:border-purple-500 transition"
            >
              <h3 className="text-lg font-medium">{feature}</h3>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
