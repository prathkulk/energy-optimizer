export function Footer() {
    return (
      <footer className="border-t bg-gray-50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              Energy Price Optimization Simulator v1.0.0
            </p>
            <div className="flex gap-4 text-sm text-gray-600">
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                API Docs
              </a>
              <a
                href="https://www.preisenergie.de"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                Preisenergie.de
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }