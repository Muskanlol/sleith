function TestTailwind() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Tailwind v4 is Working!
        </h1>
        <p className="text-gray-600">
          If you see this styled nicely, we're good to go.
        </p>
        <button className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
          Test Button
        </button>
      </div>
    </div>
  );
}

export default TestTailwind;