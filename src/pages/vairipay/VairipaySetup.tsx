import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, GripVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PaymentApp {
  id: string;
  app_name: string;
  app_category: string;
  download_url_ios: string | null;
  download_url_android: string | null;
}

interface UserPaymentMethod {
  id: string;
  payment_app_id: string;
  preference_order: number;
  qr_code_image_url: string | null;
  username_handle: string | null;
  wallet_address: string | null;
  payment_app: PaymentApp;
}

function SortablePaymentItem({ method, onRemove }: { method: UserPaymentMethod; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: method.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{method.payment_app.app_name}</p>
            <p className="text-sm text-muted-foreground">#{method.preference_order}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VairipaySetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentApps, setPaymentApps] = useState<PaymentApp[]>([]);
  const [userMethods, setUserMethods] = useState<UserPaymentMethod[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [usernameHandle, setUsernameHandle] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchPaymentApps();
    fetchUserMethods();
  }, []);

  const fetchPaymentApps = async () => {
    const { data } = await supabase
      .from("payment_apps")
      .select("*")
      .eq("is_active", true)
      .order("app_name");
    
    if (data) setPaymentApps(data);
  };

  const fetchUserMethods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_payment_methods")
      .select(`
        *,
        payment_app:payment_apps(*)
      `)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("preference_order");

    if (data) setUserMethods(data as any);
  };

  const handleAddMethod = async () => {
    if (!selectedApp) {
      toast({ title: "Please select a payment app", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let qrCodeUrl = null;
      if (qrCodeFile) {
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${user.id}/${selectedApp}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("payment_qr_codes")
          .upload(fileName, qrCodeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("payment_qr_codes")
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
      }

      const maxOrder = Math.max(...userMethods.map(m => m.preference_order), 0);

      const { error } = await supabase
        .from("user_payment_methods")
        .insert({
          user_id: user.id,
          payment_app_id: selectedApp,
          preference_order: maxOrder + 1,
          qr_code_image_url: qrCodeUrl,
          username_handle: usernameHandle || null,
          wallet_address: walletAddress || null,
        });

      if (error) throw error;

      toast({ title: "Payment method added successfully" });
      fetchUserMethods();
      setSelectedApp("");
      setQrCodeFile(null);
      setUsernameHandle("");
      setWalletAddress("");
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast({ title: "Error adding method", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = userMethods.findIndex(m => m.id === active.id);
    const newIndex = userMethods.findIndex(m => m.id === over.id);

    const reordered = arrayMove(userMethods, oldIndex, newIndex).map((method, index) => ({
      ...method,
      preference_order: index + 1,
    }));

    setUserMethods(reordered);

    // Update in database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await Promise.all(
      reordered.map(method =>
        supabase
          .from("user_payment_methods")
          .update({ preference_order: method.preference_order })
          .eq("id", method.id)
      )
    );

    toast({ title: "Preference order updated" });
  };

  const handleRemoveMethod = async (methodId: string) => {
    await supabase
      .from("user_payment_methods")
      .delete()
      .eq("id", methodId);

    toast({ title: "Payment method removed" });
    fetchUserMethods();
  };

  const selectedAppData = paymentApps.find(app => app.id === selectedApp);

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Vairipay Setup</h1>
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Add New Method */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Payment Method
            </h2>

            <div className="space-y-2">
              <Label>Select App/Wallet</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
              >
                <option value="">Choose...</option>
                <optgroup label="P2P Apps">
                  {paymentApps.filter(app => app.app_category === 'p2p').map(app => (
                    <option key={app.id} value={app.id}>{app.app_name}</option>
                  ))}
                </optgroup>
                <optgroup label="Crypto Wallets">
                  {paymentApps.filter(app => app.app_category === 'crypto_wallet').map(app => (
                    <option key={app.id} value={app.id}>{app.app_name}</option>
                  ))}
                </optgroup>
                <optgroup label="Banks">
                  {paymentApps.filter(app => app.app_category === 'bank').map(app => (
                    <option key={app.id} value={app.id}>{app.app_name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {selectedAppData && selectedAppData.app_category === 'crypto_wallet' && (
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>
            )}

            {selectedAppData && selectedAppData.app_category !== 'crypto_wallet' && (
              <>
                <div className="space-y-2">
                  <Label>Username/Handle (optional)</Label>
                  <Input
                    placeholder="@username"
                    value={usernameHandle}
                    onChange={(e) => setUsernameHandle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload QR Code (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)}
                  />
                </div>
              </>
            )}

            <Button onClick={handleAddMethod} disabled={isLoading} className="w-full">
              {isLoading ? "Adding..." : "Add Method"}
            </Button>
          </CardContent>
        </Card>

        {/* Your Payment Methods */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Your Payment Methods (Drag to reorder preference)
          </h2>

          {userMethods.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No payment methods added yet
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={userMethods.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {userMethods.map(method => (
                  <SortablePaymentItem
                    key={method.id}
                    method={method}
                    onRemove={() => handleRemoveMethod(method.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Download Links for Missing Apps */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Don't have an app? Download it:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentApps.slice(0, 10).map(app => (
                <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{app.app_name}</span>
                  <div className="flex gap-2">
                    {app.download_url_ios && (
                      <a href={app.download_url_ios} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          iOS
                        </Button>
                      </a>
                    )}
                    {app.download_url_android && (
                      <a href={app.download_url_android} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Android
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
