import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User as UserIcon, MapPin, Tag, Info } from "lucide-react";
import LocationsManager from "@/components/LocationsManager";
import CategoriesManager from "@/components/CategoriesManager";
import { useAppAuth } from "@/hooks/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [error, setError] = useState<string | null>(null);
  const { user, users } = useAppAuth();
  
  console.log("Settings component rendering, active tab:", activeTab);

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
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
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
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback className="text-2xl">{user?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user?.username}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              {users && users.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Household Members</h4>
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatar} alt={u.username} />
                          <AvatarFallback>{u.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{u.username}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        {u.id === user?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">You</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations">
          <LocationsManager />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoriesManager />
        </TabsContent>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About AAFairShare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Version</h3>
                <p className="text-sm text-gray-600">1.0.0</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-600">
                  A simple and elegant household expense management application for tracking shared expenses,
                  managing settlements, and analyzing spending patterns.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Track shared household expenses</li>
                  <li>Automatic settlement calculations</li>
                  <li>Recurring expense management</li>
                  <li>Detailed analytics and insights</li>
                  <li>Export to CSV and PDF</li>
                  <li>Mobile-optimized interface</li>
                  <li>Keyboard shortcuts for power users</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
