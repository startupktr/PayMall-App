// import * as FileSystem from "expo-file-system";
// import * as SecureStore from "expo-secure-store";

// const URL = "http://192.168.1.4:8000";

// export async function downloadInvoice(orderId: number, orderNumber?: string) {
//   const token = await SecureStore.getItemAsync("accessToken");
//   if (!token) throw new Error("Login required");

//   const fileName = `invoice_${orderNumber || orderId}.pdf`;
//   const invoiceUrl = `${URL}/api/orders/${orderId}/invoice/`;

//   // ✅ Paths is a class in your build
//   const paths = new (FileSystem as any).Paths();
//   const baseDir = paths?.cache?.uri || paths?.document?.uri;

//   if (!baseDir) throw new Error("File system not available");

//   // ✅ File is a class -> must use `new`
//   const file = new (FileSystem as any).File(`${baseDir}${fileName}`);

//   // ✅ new download API (non-deprecated)
//   await file.downloadAsync(invoiceUrl, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   return file.uri;
// }



import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Types
interface Mall {
  name?: string;
  address?: string;
  gstin?: string;
  fssai?: string;
  state_code?: string;
  state_name?: string;
}

interface User {
  full_name?: string;
  email?: string;
  phone_number?: string;
}

interface Product {
  hsn_code?: string;
}

interface OrderItem {
  product_name?: string;
  quantity?: number;
  product_price?: string | number;
  cgst_amount?: string | number;
  sgst_amount?: string | number;
  total_price?: string | number;
  hsn_code?: string;
  product?: Product;
}

interface Order {
  id: number;
  order_number: string;
  created_at: string;
  mall?: Mall;
  user?: User;
  items?: OrderItem[];
  subtotal?: string | number;
  cgst?: string | number;
  sgst?: string | number;
  total?: string | number;
  payment_method?: string;
  gateway_payment_id?: string;
}

interface DownloadInvoiceButtonProps {
  order: Order;
  buttonText?: string;
}

const DownloadInvoiceButton: React.FC<DownloadInvoiceButtonProps> = ({ 
  order,
  buttonText = "Download Invoice"
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  const generateInvoiceHTML = (): string => {
    const {
      mall,
      order_number,
      created_at,
      id,
      user,
      items = [],
      subtotal = 0,
      cgst = 0,
      sgst = 0,
      total = 0,
      payment_method = 'UPI',
      gateway_payment_id,
    } = order;

    const date = new Date(created_at);
    const invoiceNo = `PM-${date.toISOString().slice(0, 10).replace(/-/g, '')}${id}`;
    const invoiceDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const placeOfSupply = 
      mall?.state_name && mall?.state_code 
        ? `${mall.state_name} (${mall.state_code})` 
        : mall?.state_name || '';

    const itemRows = items.map((item, idx) => {
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#F8FAFC';
      const hsnCode = item.product?.hsn_code || item.hsn_code || '';
      
      return `
        <tr style="background-color: ${bgColor};">
          <td style="text-align: center; padding: 8px; border: 0.5px solid #CBD5E1;">${idx + 1}</td>
          <td style="padding: 8px; border: 0.5px solid #CBD5E1;">${item.product_name || ''}</td>
          <td style="text-align: center; padding: 8px; border: 0.5px solid #CBD5E1;">${hsnCode}</td>
          <td style="text-align: center; padding: 8px; border: 0.5px solid #CBD5E1;">${item.quantity || 1}</td>
          <td style="text-align: right; padding: 8px; border: 0.5px solid #CBD5E1;">${parseFloat(String(item.product_price || 0)).toFixed(2)}</td>
          <td style="text-align: right; padding: 8px; border: 0.5px solid #CBD5E1;">${parseFloat(String(item.cgst_amount || 0)).toFixed(2)}</td>
          <td style="text-align: right; padding: 8px; border: 0.5px solid #CBD5E1;">${parseFloat(String(item.sgst_amount || 0)).toFixed(2)}</td>
          <td style="text-align: right; padding: 8px; border: 0.5px solid #CBD5E1;">${parseFloat(String(item.total_price || 0)).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Helvetica, Arial, sans-serif; padding: 20px; font-size: 12px; color: #000; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .header-left h1 { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
          .header-left p { margin: 4px 0; font-size: 11px; }
          .logo { font-size: 26px; font-weight: bold; color: #2563EB; }
          .logo .green { color: #10B981; }
          .divider { border-top: 1px solid #CBD5E1; margin: 15px 0; }
          .invoice-title { text-align: center; font-size: 15px; font-weight: bold; margin: 20px 0; }
          .invoice-meta { margin: 20px 0; }
          .invoice-meta p { margin: 6px 0; }
          .bill-to { margin: 20px 0; }
          .bill-to h3 { color: #2563EB; font-size: 13px; margin-bottom: 10px; }
          .bill-to p { margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #1E3A8A; color: white; padding: 10px 8px; text-align: left; font-size: 11px; font-weight: bold; border: 0.5px solid #CBD5E1; }
          td { font-size: 10px; }
          .summary { text-align: right; margin: 20px 0; }
          .summary p { margin: 6px 0; font-weight: bold; }
          .summary .total { font-size: 13px; margin-top: 10px; }
          .payment-info { margin: 20px 0; color: #2563EB; font-weight: bold; }
          .payment-info p { margin: 6px 0; }
          .footer { margin-top: 30px; }
          .footer p { margin: 8px 0; font-size: 10px; }
          .footer .italic { font-style: italic; color: #666; }
          .footer h4 { font-size: 11px; margin-top: 15px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-left">
              <h1>${mall?.name || 'Shopping Mall Superstore'}</h1>
              ${mall?.address ? `<p>${mall.address}</p>` : ''}
              ${mall?.gstin ? `<p>GSTIN: ${mall.gstin}</p>` : ''}
              ${mall?.fssai ? `<p>FSSAI: ${mall.fssai}</p>` : ''}
            </div>
            <div class="header-right">
              <div class="logo">Pay<span class="green">Mall</span></div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="invoice-title">TAX INVOICE (IN-STORE PURCHASE)</div>
          <div class="divider"></div>
          <div class="invoice-meta">
            <p><strong>Invoice No:</strong> ${invoiceNo}</p>
            <p><strong>Order ID:</strong> ${order_number}</p>
            <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
            ${placeOfSupply ? `<p><strong>Place of Supply:</strong> ${placeOfSupply}</p>` : ''}
          </div>
          <div class="divider"></div>
          <div class="bill-to">
            <h3>BILL TO</h3>
            <p><strong>Customer Name:</strong> ${user?.full_name || user?.email || 'Customer'}</p>
            ${user?.phone_number ? `<p><strong>Mobile:</strong> +91 ${user.phone_number}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 5%;">#</th>
                <th style="width: 30%;">Item</th>
                <th style="text-align: center; width: 10%;">HSN</th>
                <th style="text-align: center; width: 8%;">Qty</th>
                <th style="text-align: right; width: 12%;">Rate</th>
                <th style="text-align: right; width: 12%;">CGST</th>
                <th style="text-align: right; width: 12%;">SGST</th>
                <th style="text-align: right; width: 12%;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div class="summary">
            <p>Item Total: ₹${parseFloat(String(subtotal)).toFixed(2)}</p>
            <p>CGST: ₹${parseFloat(String(cgst)).toFixed(2)}</p>
            <p>SGST: ₹${parseFloat(String(sgst)).toFixed(2)}</p>
            <p class="total">Invoice Value: ₹${parseFloat(String(total)).toFixed(2)}</p>
          </div>
          <div class="divider"></div>
          <div class="payment-info">
            <p>Payment Mode: ${payment_method}</p>
            ${gateway_payment_id ? `<p>Transaction ID: ${gateway_payment_id}</p>` : ''}
          </div>
          <div class="divider"></div>
          <div class="footer">
            <p class="italic">This is a system-generated invoice for an in-store purchase.</p>
            <h4>Seller</h4>
            <p>${mall?.name || 'PayMall Store'}</p>
            ${mall?.address ? `<p>${mall.address}</p>` : ''}
            <h4>Platform:</h4>
            <p>PayMall Technologies Pvt. Ltd.</p>
            <p>Made in India 🇮🇳</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = async (): Promise<void> => {
    try {
      setLoading(true);

      const html = generateInvoiceHTML();
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice_${order.order_number}.pdf`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handleDownload}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.buttonText}>Generating...</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>{buttonText}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 16
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default DownloadInvoiceButton;