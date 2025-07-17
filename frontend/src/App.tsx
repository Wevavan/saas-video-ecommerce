import { useState } from "react"
import { Button } from "./components/ui/Button"
import { Input } from "./components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { Search, Plus } from "lucide-react"

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        {/* Header avec toggle de thème */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Mon SaaS Vidéo</h1>
          <ThemeToggle />
        </div>

        {/* Grid de démonstration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1 - Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Boutons</CardTitle>
              <CardDescription>Différents styles de boutons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </CardContent>
          </Card>

          {/* Card 2 - Input */}
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>Champs de saisie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Email" type="email" />
              <Input placeholder="Mot de passe" type="password" />
              <div className="flex space-x-2">
                <Input placeholder="Rechercher..." />
                <Button size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Dialog */}
          <Card>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
              <CardDescription>Modale interactive</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ouvrir Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau projet</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations ci-dessous pour créer votre projet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Nom du projet" />
                    <Input placeholder="Description" />
                    <Button className="w-full">Créer</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Section Counter */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Counter</CardTitle>
            <CardDescription>Exemple interactif</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">{count}</div>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => setCount(count - 1)} variant="outline">
                -
              </Button>
              <Button onClick={() => setCount(0)} variant="secondary">
                Reset
              </Button>
              <Button onClick={() => setCount(count + 1)}>
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App