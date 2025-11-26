import { useState, useEffect } from "react";
import { Plus, GripVertical, ExternalLink, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            <p className="text-sm text-muted-foreground">Priority #{method.preference_order}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentSetupStep() {
  const { toast } = useToast();
  const [paymentApps, setPaymentApps] = useState<PaymentApp[]>([]);
  const [userMethods, setUserMethods] = useState<UserPaymentMethod[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
        const fileName = `${user.id}/${selectedApp}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('payment_qr_codes')
          .upload(fileName, qrCodeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('payment_qr_codes')
          .getPublicUrl(fileName);

        qrCodeUrl = publicUrl;
      }

      const nextOrder = userMethods.length + 1;

      const { error } = await supabase
        .from("user_payment_methods")
        .insert({
          user_id: user.id,
          payment_app_id: selectedApp,
          preference_order: nextOrder,
          qr_code_image_url: qrCodeUrl,
          username_handle: usernameHandle || null,
          wallet_address: walletAddress || null,
        });

      if (error) throw error;

      toast({ title: "Payment method added successfully" });
      
      // Reset form
      setSelectedApp("");
      setQrCodeFile(null);
      setQrCodePreview(null);
      setUsernameHandle("");
      setWalletAddress("");
      
      // Refresh list
      fetchUserMethods();
    } catch (error: any) {
      toast({ title: "Error adding payment method", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from("user_payment_methods")
        .update({ is_active: false })
        .eq("id", methodId);

      if (error) throw error;

      toast({ title: "Payment method removed" });
      fetchUserMethods();
    } catch (error: any) {
      toast({ title: "Error removing payment method", description: error.message, variant: "destructive" });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = userMethods.findIndex((m) => m.id === active.id);
    const newIndex = userMethods.findIndex((m) => m.id === over.id);

    const newOrder = arrayMove(userMethods, oldIndex, newIndex);
    setUserMethods(newOrder);

    try {
      const updates = newOrder.map((method, index) => ({
        id: method.id,
        preference_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from("user_payment_methods")
          .update({ preference_order: update.preference_order })
          .eq("id", update.id);
      }

      toast({ title: "Payment preferences updated" });
    } catch (error: any) {
      toast({ title: "Error updating preferences", description: error.message, variant: "destructive" });
      fetchUserMethods();
    }
  };

  const selectedAppDetails = paymentApps.find(app => app.id === selectedApp);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Setup (Optional)</h3>
        <p className="text-sm text-muted-foreground">
          Add your preferred payment methods so clients can easily send you payments. You can skip this step and set it up later.
        </p>
      </div>

      {/* Add New Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Payment Method</CardTitle>
          <CardDescription>Select an app and provide your details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Payment App</Label>
            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger>
                <SelectValue placeholder="Select a payment app" />
              </SelectTrigger>
              <SelectContent>
                {paymentApps.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.app_name} ({app.app_category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAppDetails && (
              <div className="flex gap-2 mt-2">
                {selectedAppDetails.download_url_ios && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedAppDetails.download_url_ios} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      iOS
                    </a>
                  </Button>
                )}
                {selectedAppDetails.download_url_android && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedAppDetails.download_url_android} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Android
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>QR Code (Optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('qr-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload QR Code
              </Button>
              <input
                id="qr-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {qrCodePreview && (
                <div className="relative">
                  <img src={qrCodePreview} alt="QR Preview" className="w-20 h-20 object-cover rounded" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setQrCodeFile(null);
                      setQrCodePreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Username/Handle (Optional)</Label>
            <Input
              value={usernameHandle}
              onChange={(e) => setUsernameHandle(e.target.value)}
              placeholder="@username or handle"
            />
          </div>

          <div className="space-y-2">
            <Label>Wallet Address (Optional)</Label>
            <Input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Crypto wallet address"
            />
          </div>

          <Button onClick={handleAddMethod} disabled={isLoading || !selectedApp} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Current Payment Methods */}
      {userMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Payment Methods</CardTitle>
            <CardDescription>Drag to reorder by preference</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={userMethods.map(m => m.id)} strategy={verticalListSortingStrategy}>
                {userMethods.map((method) => (
                  <SortablePaymentItem
                    key={method.id}
                    method={method}
                    onRemove={() => handleRemoveMethod(method.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
