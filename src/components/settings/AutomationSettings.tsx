import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  useBankingConfig,
  useBankAuthLink,
  useLinkedBankAccounts,
  useDeleteBankAccount,
} from "@/hooks/useConvexData";
import { useSearchParams } from "react-router-dom";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Building2,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const AutomationSettings = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Banking
  const bankingConfig = useBankingConfig();
  const bankAuthLink = useBankAuthLink();
  const linkedAccounts = useLinkedBankAccounts();
  const deleteBankAccount = useDeleteBankAccount();
  const syncTransactions = useAction(api.holidays.syncTransactions);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Open Banking (TrueLayer)</CardTitle>
              <CardDescription>
                Connect your UK bank account for holiday transaction tracking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Open Banking requires TrueLayer API credentials. Connect your bank
              to automatically import transactions into the Holidays page.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">How it works:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  <strong>Connect your bank</strong> via secure Open Banking
                </li>
                <li>
                  <strong>Transactions sync</strong> automatically to the Holidays page
                </li>
                <li>
                  <strong>Track spending</strong> by category and location
                </li>
                <li>
                  <strong>Add local currency</strong> amounts for accurate holiday budgeting
                </li>
              </ol>
            </div>

            <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 space-y-3">
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Setup Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                To enable Open Banking, you need to:
              </p>
              <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                <li>
                  Register at{" "}
                  <a
                    href="https://console.truelayer.com"
                    target="_blank"
                    rel="noopener"
                    className="underline"
                  >
                    TrueLayer Console
                  </a>
                </li>
                <li>Create an application and get API credentials</li>
                <li>Add credentials to your Convex environment</li>
              </ol>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a
                  href="https://docs.truelayer.com/docs/quickstart-guide"
                  target="_blank"
                  rel="noopener"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  TrueLayer Docs
                </a>
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium">Supported UK Banks:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "Barclays",
                  "HSBC",
                  "Lloyds",
                  "NatWest",
                  "Santander",
                  "Monzo",
                  "Starling",
                  "Revolut",
                  "Halifax",
                  "TSB",
                ].map((bank) => (
                  <Badge key={bank} variant="secondary">
                    {bank}
                  </Badge>
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
                  <p className="text-sm text-muted-foreground">
                    No bank accounts linked yet
                  </p>
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
                                • Synced{" "}
                                {new Date(
                                  account.lastSyncAt,
                                ).toLocaleDateString()}
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
                                daysBack: 90,
                              });
                              toast({
                                title: "Sync complete",
                                description: `${result.imported} imported, ${result.skipped} skipped of ${result.total} transactions.`,
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
    </div>
  );
};

export default AutomationSettings;
