import { useEffect, useState } from 'react';
import { Button, Dialog, Portal, SegmentedButtons } from 'react-native-paper';
import { PaymentMethod } from '../../types/payment';

interface PaymentMethodDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (method: PaymentMethod) => void;
}

export function PaymentMethodDialog({ visible, onDismiss, onConfirm }: PaymentMethodDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>('Cash');

  useEffect(() => {
    if (visible) setMethod('Cash');
  }, [visible]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Payment method</Dialog.Title>
        <Dialog.Content>
          <SegmentedButtons
            value={method}
            onValueChange={(value) => setMethod(value as PaymentMethod)}
            buttons={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank Transfer', label: 'Bank' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Card', label: 'Card' },
            ]}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={() => onConfirm(method)}>Confirm</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
