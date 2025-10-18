import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, ArrowRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Intent {
  intentId: string;
  sourceAmount: string;
  sourceCurrency: string;
  destAmount: string;
  destCurrency: string;
  sourceChain: string;
  destChain: string;
  status: string;
  timestamp: number;
  sender: string;
  recipient: string;
  solver: string;
  totalFees: string;
  senderToSolverHash: string;
  solverToReceiverHash: string;
  hasRealData: boolean;
}

interface IntentCardProps {
  intent: Intent;
  index: number;
}

export function IntentCard({ intent, index }: IntentCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Card key={intent.intentId || index} className="glass-card p-6">
      <div className="space-y-6">
        {/* Intent Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              intent.status === 'SUCCESS' ? 'bg-green-500/20' : 
              intent.status === 'PENDING' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            }`}>
              <Receipt className={`h-5 w-5 ${
                intent.status === 'SUCCESS' ? 'text-green-600' : 
                intent.status === 'PENDING' ? 'text-yellow-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="font-medium text-lg">Payment Intent #{intent.intentId}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(intent.timestamp * 1000).toLocaleDateString()} • {intent.sourceChain} → {intent.destChain}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={`text-sm ${
              intent.status === 'SUCCESS' ? 'bg-green-500/20 text-green-700' : 
              intent.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-700' : 
              'bg-blue-500/20 text-blue-700'
            }`}>
              {intent.status}
            </Badge>
            {intent.sourceAmount && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {intent.sourceAmount} {intent.sourceCurrency}
              </p>
            )}
          </div>
        </div>

        {/* Complete Payment Flow */}
        <div className="space-y-4">
          {/* Flow Header */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step 1: Avail Intent</span>
            <ArrowRight className="h-4 w-4" />
            <span>Step 2</span>
          </div>

          {/* Two-Step Flow */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Step 1: Sender → Solver (Avail Intent) */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-800">Step 1: Avail Intent</h4>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    Intent Created
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">From:</span>
                      {intent.sender ? (
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-xs break-all">
                            {intent.sender.slice(0, 8)}...{intent.sender.slice(-6)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => copyToClipboard(intent.sender, "Sender address")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not available</p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">To Solver:</span>
                      {intent.solver ? (
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-xs break-all">
                            {intent.solver.slice(0, 8)}...{intent.solver.slice(-6)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => copyToClipboard(intent.solver, "Solver address")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not available</p>
                      )}
                    </div>
                  </div>
                  {intent.sourceAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold text-blue-700">
                        {intent.sourceAmount} {intent.sourceCurrency}
                      </span>
                    </div>
                  )}
                  {intent.sourceChain && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Source Chain:</span>
                      <span>{intent.sourceChain}</span>
                    </div>
                  )}
                  {intent.senderToSolverHash && (
                    <div className="pt-2 border-t border-blue-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">TX Hash:</span>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs"
                          onClick={() => window.open(`https://explorer.nexus-folly.availproject.org/intent/${intent.intentId}`, '_blank')}
                        >
                          View Intent
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="font-mono text-xs break-all">
                          {intent.senderToSolverHash.slice(0, 10)}...{intent.senderToSolverHash.slice(-8)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => copyToClipboard(intent.senderToSolverHash, "Transaction hash")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Solver → Receiver */}
            <div className="space-y-4">
              <div className="p-4 bg-green-50/50 rounded-lg border border-green-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-green-800">Step 2</h4>
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    {intent.status === 'SUCCESS' ? 'Completed' : 'Processing'}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">From Solver:</span>
                      {intent.solver ? (
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-xs break-all">
                            {intent.solver.slice(0, 8)}...{intent.solver.slice(-6)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => copyToClipboard(intent.solver, "Solver address")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not available</p>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">To Receiver:</span>
                      {intent.recipient ? (
                        <div className="flex items-center gap-1">
                          <p className="font-mono text-xs break-all">
                            {intent.recipient.slice(0, 8)}...{intent.recipient.slice(-6)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => copyToClipboard(intent.recipient, "Receiver address")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not available</p>
                      )}
                    </div>
                  </div>
                  {intent.destChain && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Destination Chain:</span>
                      <span>{intent.destChain}</span>
                    </div>
                  )}
                  {intent.solverToReceiverHash && (
                    <div className="pt-2 border-t border-green-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">TX Hash:</span>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs"
                          onClick={() => window.open(`https://optimism-sepolia.blockscout.com/tx/${intent.solverToReceiverHash}`, '_blank')}
                        >
                          View on Blockscout
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="font-mono text-xs break-all">
                          {intent.solverToReceiverHash.slice(0, 10)}...{intent.solverToReceiverHash.slice(-8)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => copyToClipboard(intent.solverToReceiverHash, "Transaction hash")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Footer */}
          {(intent.totalFees || intent.destAmount) && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
              {intent.totalFees && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Fees: </span>
                  <span className="font-semibold text-orange-600">
                    {intent.totalFees} {intent.sourceCurrency}
                  </span>
                </div>
              )}
              {intent.destAmount && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Net Received: </span>
                  <span className="font-semibold text-green-600">
                    {intent.destAmount} {intent.destCurrency}
                  </span>
                </div>
              )}
              {intent.solver && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Solver: </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">
                      {intent.solver.slice(0, 6)}...{intent.solver.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => copyToClipboard(intent.solver, "Solver address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}