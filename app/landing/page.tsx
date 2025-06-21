import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"

const LandingPage = () => {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Por Artigo Plan */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Por Artigo</h2>
          <p className="text-gray-600 mb-4">Pay per article you generate.</p>
          <p className="text-2xl font-bold mb-4">R$ 9 / article</p>
          <Button className="w-full" size="lg">
            Começar Grátis
          </Button>
        </div>

        {/* Professional Plan */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Professional</h2>
          <p className="text-gray-600 mb-4">Unlimited articles and features.</p>
          <p className="text-2xl font-bold mb-4">R$ 79 / month</p>
          <Link href="/payment?plan=professional">
            <Button className="w-full" size="lg">
              Assinar Agora
            </Button>
          </Link>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Enterprise</h2>
          <p className="text-gray-600 mb-4">Custom solutions for your business.</p>
          <p className="text-2xl font-bold mb-4">Contact us</p>
          <Button className="w-full" size="lg" disabled>
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
