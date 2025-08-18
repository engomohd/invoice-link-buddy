import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Shield, User } from "lucide-react"

interface LoginFormProps {
  onLogin: () => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [clientCredentials, setClientCredentials] = useState({ username: '', password: '' })
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const client = await authService.loginClient(clientCredentials.username, clientCredentials.password)
      if (client) {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${client.name}`,
        })
        onLogin()
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await authService.loginAdmin(adminCredentials.username, adminCredentials.password)
      if (success) {
        toast({
          title: "Admin access granted",
          description: "Welcome to the admin dashboard",
        })
        onLogin()
      } else {
        toast({
          title: "Login failed",
          description: "Invalid admin credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Invoice Portal</CardTitle>
          <CardDescription>
            Access your invoices and payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="client" className="space-y-4">
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-username">Username</Label>
                  <Input
                    id="client-username"
                    type="text"
                    placeholder="Enter your username"
                    value={clientCredentials.username}
                    onChange={(e) => setClientCredentials(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-password">Password</Label>
                  <Input
                    id="client-password"
                    type="password"
                    placeholder="Enter your password"
                    value={clientCredentials.password}
                    onChange={(e) => setClientCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="text-sm text-muted-foreground text-center">
                Demo credentials: john_doe / password123
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Admin Username</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="Enter admin username"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Admin Sign In"}
                </Button>
              </form>
              <div className="text-sm text-muted-foreground text-center">
                Demo credentials: admin / admin123
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}