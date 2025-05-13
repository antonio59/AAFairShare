import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import LocationsManager from "@/components/LocationsManager";
import CategoriesManager from "@/components/CategoriesManager";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<string>("locations");
  const [error, setError] = useState<string | null>(null);
  
  console.log("Settings component rendering, active tab:", activeTab);

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs 
        defaultValue="locations" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="locations" className="mt-4 border p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Locations Management</h2>
          <LocationsManager />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4 border p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-4">Categories Management</h2>
          <CategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
