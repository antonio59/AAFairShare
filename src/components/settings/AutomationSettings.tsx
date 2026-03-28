import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  useMerchantMappings, 
  useSeedUtilityMappings, 
  useCategories, 
  useDeleteMerchantMapping, 
  useCreateMerchantMapping,
  useBankingConfig,
  useBankAuthLink,
  useLinkedBankAccounts,
  useDeleteBankAccount,
} from "@/hooks/useConvexData";
import { useSearchParams } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Smartphone,
  Building2,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  Wifi,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

const AutomationSettings = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const merchantMappings = useMerchantMappings();
  const categories = useCategories();
  const seedUtilities = useSeedUtilityMappings();
  const deleteMappingMutation = useDeleteMerchantMapping();
  const createMappingMutation = useCreateMerchantMapping();

  // Banking
  const bankingConfig = useBankingConfig();
  const bankAuthLink = useBankAuthLink();
  const linkedAccounts = useLinkedBankAccounts();
  const deleteBankAccount = useDeleteBankAccount();
  const syncTransactions = useAction(api.banking.syncTransactions);

  const [copied, setCopied] = useState<string | null>(null);
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [newMapping, setNewMapping] = useState({
    pattern: "",
    categoryId: "",
    isUtility: false,
  });
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Handle bank connection callback messages
  useState(() => {
    const bankSuccess = searchParams.get("bank_success");
    const bankError = searchParams.get("bank_error");

    if (bankSuccess) {
      toast({
        title: "Bank connected!",
        description: `Successfully linked ${bankSuccess} account(s).`,
      });
      setSearchParams({});
    }

    if (bankError) {
      toast({
        title: "Bank connection failed",
        description: bankError,
        variant: "destructive",
      });
      setSearchParams({});
    }
  });

  const appUrl = window.location.origin;
  const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace("https://", "").replace(".convex.cloud", "") || "YOUR_PROJECT";

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied!", description: "URL copied to clipboard" });
  };

  const handleSeedUtilities = async () => {
    setIsSeeding(true);
    try {
      const result = await seedUtilities({});
      toast({
        title: "Utilities seeded",
        description: `Added ${result.created} UK utility provider mappings.`,
      });
    } catch (_error) {
      toast({ title: "Error", description: "Failed to seed utilities.", variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.pattern || !newMapping.categoryId) {
      toast({ title: "Missing fields", description: "Pattern and category are required.", variant: "destructive" });
      return;
    }

    try {
      await createMappingMutation({
        merchantPattern: newMapping.pattern,
        categoryId: newMapping.categoryId as Id<"categories">,
        isUtility: newMapping.isUtility,
      });
      toast({ title: "Mapping added", description: `"${newMapping.pattern}" will auto-categorize.` });
      setShowAddMapping(false);
      setNewMapping({ pattern: "", categoryId: "", isUtility: false });
    } catch (_error) {
      toast({ title: "Error", description: "Failed to add mapping.", variant: "destructive" });
    }
  };

  const handleDeleteMapping = async (id: Id<"merchantMappings">) => {
    try {
      await deleteMappingMutation({ id });
      toast({ title: "Deleted", description: "Mapping removed." });
    } catch (_error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mobile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mobile" className="gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Mobile Pay</span>
          </TabsTrigger>
          <TabsTrigger value="banking" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Open Banking</span>
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Auto-Categorize</span>
          </TabsTrigger>
        </TabsList>

        {/* Mobile Pay Setup */}
        <TabsContent value="mobile" className="space-y-4 mt-4">
          {/* Apple Pay */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gray-900 text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Apple Pay (iOS)</CardTitle>
                  <CardDescription>Auto-prompt after every Apple Pay transaction</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setup Instructions:</Label>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Open <strong>Shortcuts</strong> app on your iPhone</li>
                  <li>Go to <strong>Automation</strong> tab → tap <strong>+</strong></li>
                  <li>Select <strong>Create Personal Automation</strong></li>
                  <li>Scroll down and tap <strong>Transaction</strong></li>
                  <li>Choose <strong>Any Card</strong> or select specific cards</li>
                  <li>Tap <strong>Next</strong> → Add action <strong>Open URLs</strong></li>
                  <li>Paste the URL below</li>
                  <li>Tap <strong>Next</strong> → Disable <strong>Ask Before Running</strong></li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Add URL:</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${appUrl}/quick-add?source=applepay`}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`${appUrl}/quick-add?source=applepay`, "applepay")}
                  >
                    {copied === "applepay" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: iOS 17+ required. Amount/merchant auto-fill isn't available in Shortcuts yet - you'll enter manually.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Wallet */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Wallet (Android)</CardTitle>
                  <CardDescription>Log expenses via IFTTT or Tasker</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Android doesn't have native Shortcuts like iOS. Use IFTTT or Tasker to capture Google Wallet notifications.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Option 1: IFTTT (Easiest)</span>
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Install <a href="https://ifttt.com" target="_blank" rel="noopener" className="text-primary underline">IFTTT</a> app</li>
                    <li>Create new Applet: <strong>IF</strong> Android Notification → "Google Wallet"</li>
                    <li><strong>THEN</strong> Open URL in browser</li>
                    <li>Use URL: <code className="bg-muted px-1 rounded">{appUrl}/quick-add?source=googlepay</code></li>
                  </ol>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Option 2: Tasker + Webhook (Advanced)</span>
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Install <a href="https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm" target="_blank" rel="noopener" className="text-primary underline">Tasker</a></li>
                    <li>Create Profile: Event → Notification → App: Google Wallet</li>
                    <li>Add Task: HTTP Request → POST to webhook URL</li>
                    <li>Parse notification text for amount/merchant</li>
                  </ol>
                  <div className="space-y-2 mt-3">
                    <Label className="text-xs font-medium">Webhook URL:</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={`https://${convexUrl}.convex.site/api/webhook/transaction`}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(`https://${convexUrl}.convex.site/api/webhook/transaction`, "webhook")}
                      >
                        {copied === "webhook" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre>{`POST /api/webhook/transaction
Content-Type: application/json

{
  "amount": 12.99,
  "merchantName": "Tesco",
  "source": "googlepay",
  "date": "2024-01-15"
}`}</pre>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Add URL (for browser redirect):</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${appUrl}/quick-add?source=googlepay`}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`${appUrl}/quick-add?source=googlepay`, "googlepay")}
                  >
                    {copied === "googlepay" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Banking */}
        <TabsContent value="banking" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Open Banking (TrueLayer)</CardTitle>
                  <CardDescription>
                    Connect your UK bank to automatically import transactions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Open Banking requires TrueLayer API credentials. This is the most powerful option - it auto-detects ALL card transactions and can automatically log utilities.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">How it works:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li><strong>Connect your bank</strong> via secure Open Banking</li>
                    <li><strong>Transactions sync</strong> automatically every few hours</li>
                    <li><strong>Utilities auto-log</strong> (British Gas, Thames Water, etc.)</li>
                    <li><strong>Other transactions</strong> appear in Pending queue for one-tap approval</li>
                  </ol>
                </div>

                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 space-y-3">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200">Setup Required</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    To enable Open Banking, you need to:
                  </p>
                  <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                    <li>Register at <a href="https://console.truelayer.com" target="_blank" rel="noopener" className="underline">TrueLayer Console</a></li>
                    <li>Create an application and get API credentials</li>
                    <li>Add credentials to your Convex environment</li>
                    <li>Configure webhook URL: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">/api/webhook/truelayer</code></li>
                  </ol>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="https://docs.truelayer.com/docs/quickstart-guide" target="_blank" rel="noopener">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      TrueLayer Docs
                    </a>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">Supported UK Banks:</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Barclays", "HSBC", "Lloyds", "NatWest", "Santander", "Monzo", "Starling", "Revolut", "Halifax", "TSB"].map((bank) => (
                      <Badge key={bank} variant="secondary">{bank}</Badge>
                    ))}
                    <Badge variant="outline">+60 more</Badge>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Connected Accounts</p>
                    {bankingConfig?.isConfigured && bankAuthLink?.authUrl && (
                      <Button size="sm" asChild>
                        <a href={bankAuthLink.authUrl}>
                          <Plus className="h-4 w-4 mr-2" />
                          Link Bank
                        </a>
                      </Button>
                    )}
                  </div>

                  {!linkedAccounts || linkedAccounts.length === 0 ? (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No bank accounts linked yet</p>
                      {!bankingConfig?.isConfigured && (
                        <p className="text-xs text-amber-600 mt-1">
                          TrueLayer credentials not configured
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {linkedAccounts.map((account) => (
                        <div
                          key={account._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                              <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">{account.accountName}</p>
                              <p className="text-xs text-muted-foreground">
                                {account.institutionName}
                                {account.lastSyncAt && (
                                  <span className="ml-2">
                                    • Synced {new Date(account.lastSyncAt).toLocaleDateString()}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSyncing === account._id}
                              onClick={async () => {
                                setIsSyncing(account._id);
                                try {
                                  const result = await syncTransactions({
                                    bankLinkId: account._id,
                                    daysBack: 30,
                                  });
                                  toast({
                                    title: "Sync complete",
                                    description: `${result.created} new transactions, ${result.skipped} skipped.`,
                                  });
                                } catch (_err) {
                                  toast({
                                    title: "Sync failed",
                                    description: "Could not fetch transactions.",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setIsSyncing(null);
                                }
                              }}
                            >
                              {isSyncing === account._id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={async () => {
                                await deleteBankAccount({ id: account._id });
                                toast({ title: "Account removed" });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Detection Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recurring Transaction Detection</CardTitle>
              <CardDescription>
                How utilities and subscriptions are auto-logged
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When Open Banking is connected, transactions matching your merchant mappings will be automatically logged. Utilities marked as "auto-log" skip the pending queue entirely.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Auto-Logged (Utilities)</h4>
                  <p className="text-xs text-muted-foreground">
                    Energy, water, council tax, broadband - logged automatically with 50/50 split
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Pending Queue</h4>
                  <p className="text-xs text-muted-foreground">
                    All other transactions - approve with one tap or dismiss
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Merchant Mappings */}
        <TabsContent value="mappings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Merchant Auto-Categorization</CardTitle>
                  <CardDescription>
                    Map merchants to categories for automatic tagging
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeedUtilities}
                    disabled={isSeeding}
                  >
                    {isSeeding ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                    Seed UK Utilities
                  </Button>
                  <Button size="sm" onClick={() => setShowAddMapping(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!merchantMappings || merchantMappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No merchant mappings yet.</p>
                  <p className="text-sm">Click "Seed UK Utilities" to add common providers.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {merchantMappings.map((mapping) => (
                    <div
                      key={mapping._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {mapping.merchantPattern}
                        </code>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="secondary">{mapping.categoryName}</Badge>
                        {mapping.isUtility && (
                          <Badge variant="default" className="bg-green-500">Auto-log</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteMapping(mapping._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Mapping Dialog */}
      <Dialog open={showAddMapping} onOpenChange={setShowAddMapping}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Merchant Mapping</DialogTitle>
            <DialogDescription>
              Transactions containing this pattern will be auto-categorized
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Merchant Pattern</Label>
              <Input
                placeholder="e.g., tesco, amazon, netflix"
                value={newMapping.pattern}
                onChange={(e) => setNewMapping({ ...newMapping, pattern: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Case-insensitive. Matches if merchant name contains this text.
              </p>
            </div>
            <div>
              <Label>Category</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={newMapping.categoryId}
                onChange={(e) => setNewMapping({ ...newMapping, categoryId: e.target.value })}
              >
                <option value="">Select category...</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isUtility"
                checked={newMapping.isUtility}
                onChange={(e) => setNewMapping({ ...newMapping, isUtility: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isUtility" className="cursor-pointer">
                Auto-log as utility (skip pending queue)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMapping(false)}>Cancel</Button>
            <Button onClick={handleAddMapping}>Add Mapping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationSettings;
