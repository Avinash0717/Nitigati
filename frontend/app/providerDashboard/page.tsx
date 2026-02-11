export default function ProviderDashboardPage() {
    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-sans">
            <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-zinc-100 text-center max-w-lg">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="text-4xl">🚀</span>
                </div>
                <h1 className="text-3xl font-black text-zinc-900 mb-4">Provider Dashboard</h1>
                <p className="text-zinc-500 font-medium mb-8 leading-relaxed">
                    Welcome to Nitigati! Your dashboard is currently being built. Soon you'll be able to manage your services, view analytics, and chat with customers.
                </p>
                <div className="inline-block px-8 py-3 bg-zinc-100 text-zinc-400 font-bold rounded-xl uppercase tracking-widest text-xs">
                    Coming Soon
                </div>
            </div>
        </div>
    );
}
