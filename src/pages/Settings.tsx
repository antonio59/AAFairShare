import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  User as UserIcon,
  MapPin,
  Tag,
  Info,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  Monitor,
  Contrast,
  Zap,
  Lock,
} from "lucide-react";
import LocationsManager from "@/components/LocationsManager";
import CategoriesManager from "@/components/CategoriesManager";
import { useAuth } from "@/providers/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getFullVersion,
  getBuildInfo,
  FEATURES,
  VERSION_HISTORY,
} from "@/lib/version";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/providers/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useChangePassword } from "@/hooks/useConvexData";
import AutomationSettings from "@/components/settings/AutomationSettings";

const Settings = () => {
  const [_activeTab, setActiveTab] = useState<string>("profile");
  const [error, _setError] = useState<string | null>(null);
  const { user, users } = useAuth();
  const { theme, setTheme } = useTheme();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="container mx-auto p-4 sm:p-6 pb-20 sm:pb-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="profile"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-6 grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Automation</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">About</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold truncate">
                    {user?.username}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {users && users.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Household Members</h4>
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={u.avatar} alt={u.username} />
                          <AvatarFallback>
                            {u.username?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.username}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                        {u.id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">
                            You
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3">Theme</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-5 w-5" />
                      <span className="text-xs">Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-5 w-5" />
                      <span className="text-xs">Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme("system")}
                    >
                      <Monitor className="h-5 w-5" />
                      <span className="text-xs">System</span>
                    </Button>
                    <Button
                      variant={
                        theme === "high-contrast" ? "default" : "outline"
                      }
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => setTheme("high-contrast")}
                    >
                      <Contrast className="h-5 w-5" />
                      <span className="text-xs">High Contrast</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    High Contrast mode is optimized for grayscale displays
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPassword !== confirmPassword) {
                    toast({
                      title: "Passwords don't match",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (newPassword.length < 8) {
                    toast({
                      title: "Password must be at least 8 characters",
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsChangingPassword(true);
                  try {
                    await changePassword({ currentPassword, newPassword });
                    toast({ title: "Password updated" });
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  } catch {
                    toast({
                      title: "Incorrect current password",
                      variant: "destructive",
                    });
                  } finally {
                    setIsChangingPassword(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    isChangingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <AutomationSettings />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsManager />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesManager />
        </TabsContent>

        <TabsContent value="about">
          <div className="space-y-6">
            {/* Version Info */}
            <Card>
              <CardHeader>
                <CardTitle>Version Information</CardTitle>
                <CardDescription>
                  Current app version and build details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="text-2xl font-bold text-primary">
                      {getFullVersion()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getBuildInfo().buildDate.split("T")[0]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Build Date</p>
                    <p className="font-mono text-xs">
                      {new Date(getBuildInfo().buildDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commit</p>
                    <p className="font-mono text-xs">
                      {getBuildInfo().commit.substring(0, 7)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle>Features in This Version</CardTitle>
                <CardDescription>
                  What's included in your current build
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(FEATURES).map(([key, enabled]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-lg border ${
                        enabled
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-muted border-border dark:bg-muted/50 dark:border-border"
                      }`}
                    >
                      {enabled ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground dark:text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* About App */}
            <Card>
              <CardHeader>
                <CardTitle>About AAFairShare</CardTitle>
                <CardDescription>
                  Expense tracking made simple for couples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A simple and elegant household expense management application
                  for tracking shared expenses, managing settlements, and
                  analyzing spending patterns. Built with React, TypeScript, and
                  Convex.
                </p>

                <div>
                  <h3 className="font-semibold mb-3">Core Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        Track shared household expenses with automatic 50/50
                        splitting
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        Savings goals with history and milestone tracking
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        Automatic settlement calculations with email reports
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>
                        Recurring expense management (rent, bills,
                        subscriptions)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Detailed analytics with charts and insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Export to CSV and PDF for record keeping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Progressive Web App - install on any device</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Works offline with smart caching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Mobile-optimized responsive interface</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  Recent updates and improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {VERSION_HISTORY.map((version, idx) => (
                    <div
                      key={version.version}
                      className={`pb-4 ${idx !== VERSION_HISTORY.length - 1 ? "border-b" : ""}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={idx === 0 ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {version.date}
                        </span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                        {version.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
