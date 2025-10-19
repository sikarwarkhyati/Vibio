import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CreditCard, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface AddPaymentMethodDialogProps {
  onAdd: (paymentMethod: {
    card_last_four: string;
    card_type: string;
    expires_at: string;
    is_default: boolean;
  }) => Promise<void>;
}

const AddPaymentMethodDialog: React.FC<AddPaymentMethodDialogProps> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_type: 'visa',
    is_default: false,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.card_number || !formData.expiry_month || !formData.expiry_year || !formData.cvv) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.card_number.replace(/\s/g, '').length !== 16) {
      toast({
        title: 'Invalid Card Number',
        description: 'Card number must be 16 digits.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.cvv.length !== 3 && formData.cvv.length !== 4) {
      toast({
        title: 'Invalid CVV',
        description: 'CVV must be 3 or 4 digits.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const cardNumber = formData.card_number.replace(/\s/g, '');
      const lastFour = cardNumber.slice(-4);
      const expiryDate = `${formData.expiry_month}/${formData.expiry_year}`;

      await onAdd({
        card_last_four: lastFour,
        card_type: formData.card_type,
        expires_at: expiryDate,
        is_default: formData.is_default,
      });

      setFormData({
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        card_type: 'visa',
        is_default: false,
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData({ ...formData, card_number: formatted });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setFormData({ ...formData, cvv: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Add a new payment method to your account. Your card information is securely encrypted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card_number">Card Number</Label>
            <Input
              id="card_number"
              placeholder="1234 5678 9012 3456"
              value={formData.card_number}
              onChange={handleCardNumberChange}
              maxLength={19}
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry_month">Month</Label>
              <Select value={formData.expiry_month} onValueChange={(value) => setFormData({ ...formData, expiry_month: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiry_year">Year</Label>
              <Select value={formData.expiry_year} onValueChange={(value) => setFormData({ ...formData, expiry_year: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="YY" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i).toString().slice(-2);
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={formData.cvv}
                onChange={handleCvvChange}
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_type">Card Type</Label>
            <Select value={formData.card_type} onValueChange={(value) => setFormData({ ...formData, card_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Mastercard</SelectItem>
                <SelectItem value="american-express">American Express</SelectItem>
                <SelectItem value="discover">Discover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
            <Label htmlFor="is_default">Set as default payment method</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentMethodDialog;