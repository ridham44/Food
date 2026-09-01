import type { AxiosInstance } from 'axios';
import { fetchOrders, fetchOrderDetail } from '@/features/orders/ordersApi';
import type { OrderListFilters, OrderListItem } from '@/features/orders/types';
import { apiClient } from '@/services/api/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'searchOrders',
      description: 'Search orders by customer name, phone number, or order ID.',
      parameters: {
        type: 'object',
        properties: {
          searchQuery: {
            type: 'string',
            description: 'The customer name, phone number, or order ID to search for.',
          },
        },
        required: ['searchQuery'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getOrdersByStatus',
      description: 'Get orders filtered by status (e.g. pending, completed, cancelled, new, preparing, ready).',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'The status to filter by (new, preparing, ready, completed, cancelled, all).',
          },
        },
        required: ['status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSalesSummary',
      description: 'Get a summary of sales, total orders, and average order value. Provide a timeframe if needed.',
      parameters: {
        type: 'object',
        properties: {
          timeframe: {
            type: 'string',
            description: 'Optional timeframe (e.g. today, this week, all time)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getOrdersByType',
      description: 'Get orders filtered by type (e.g. dine-in, takeaway, delivery).',
      parameters: {
        type: 'object',
        properties: {
          orderType: {
            type: 'string',
            description: 'The type of order (dine_in, takeaway, delivery, all)',
          },
        },
        required: ['orderType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getOrderById',
      description: 'Get the full details of a specific order including the exact items ordered (menu items, combos).',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'The exact ID of the order to look up.',
          },
        },
        required: ['orderId'],
      },
    },
  },
];

async function executeTool(name: string, args: any): Promise<string> {
  try {
    let filters: OrderListFilters = { page: 1, pageSize: 100 };
    if (name === 'searchOrders') {
      filters.search = args.searchQuery;
    } else if (name === 'getOrdersByStatus') {
      const s = (args.status || 'all').toLowerCase();
      if (s === 'cancelled') filters.status = '3';
      else if (s === 'new') filters.status = '1';
      else if (s !== 'all') {
        filters.status = '2';
        filters.kitchenStatus = s;
      }
    } else if (name === 'getOrdersByType') {
      const t = (args.orderType || 'all').toLowerCase();
      if (t === 'dine-in' || t === 'dine_in') filters.orderType = 'dine_in';
      else if (t === 'takeaway') filters.orderType = 'takeaway';
      else if (t === 'delivery') filters.orderType = 'delivery';
    } else if (name === 'getSalesSummary') {
      filters.pageSize = 500; 
    }

    if (name === 'getOrderById') {
      const detail = await fetchOrderDetail(args.orderId);
      if (!detail) return JSON.stringify({ error: 'Order not found' });
      return JSON.stringify({
        id: args.orderId,
        customerName: detail.customerName,
        customerMobile: detail.customerMobile,
        placedBy: detail.placedBy === '1' ? 'Customer' : 'Tenant',
        createdAt: detail.createdAt,
        bill: detail.bill
          ? {
              totalAmount: detail.bill.totalAmount,
              finalAmount: detail.bill.finalAmount,
              discount: detail.bill.discount,
              paymentStatus: detail.bill.paymentStatus,
              gstPercent: detail.bill.gstPercent,
            }
          : null,
        cancelReason: detail.cancelReason || null,
        items: detail.items?.map((i) => ({
          type: i.type,
          name: i.menuName || i.comboName || 'Unknown item',
          quantity: i.quantity,
          price: i.menuPrice ?? i.comboPrice ?? 0,
          totalPrice: i.totalPrice,
          specialInstruction: i.specialInstruction,
        })),
      });
    }

    const result = await fetchOrders(filters);
    
    const ordersSummary = result.rows.map(o => ({
      id: o.id.slice(0, 8),
      customerName: o.customerName || 'Guest',
      customerMobile: o.customerMobile,
      total: o.total,
      itemCount: o.itemCount,
      orderType: o.orderType,
      status: o.status,
      kitchenStatus: o.kitchenStatus,
      tableNumber: o.tableNumber,
      createdAt: o.createdAt
    }));

    if (name === 'getSalesSummary') {
      const completed = ordersSummary.filter(o => o.status === '2');
      const totalRevenue = completed.reduce((sum, o) => sum + (o.total || 0), 0);
      const ordersWithTotal = completed.filter(o => o.total != null).length;
      const ordersWithoutTotal = completed.length - ordersWithTotal;
      
      let highestOrder = null;
      for (const o of completed) {
        if (o.total != null && (!highestOrder || o.total > highestOrder.total!)) {
          highestOrder = o;
        }
      }
      
      return JSON.stringify({
        totalOrders: result.count,
        completedOrders: completed.length,
        totalRevenue: totalRevenue,
        ordersWithAmountsRecorded: ordersWithTotal,
        ordersWithMissingAmounts: ordersWithoutTotal,
        averageOrderValue: ordersWithTotal > 0 ? (totalRevenue / ordersWithTotal).toFixed(2) : 0,
        highestValueOrder: highestOrder ? { id: highestOrder.id, customer: highestOrder.customerName, total: highestOrder.total } : null
      });
    }

    return JSON.stringify({
      totalFound: result.count,
      orders: ordersSummary
    });
  } catch (err: any) {
    return JSON.stringify({ error: err.message });
  }
}

export async function askOrderAssistant(
  question: string,
  history: ChatMessage[],
  onProgress?: (msg: string) => void
): Promise<{ reply: string; newHistory: ChatMessage[] }> {
  
  const systemPrompt = `You are Alica, an intelligent AI assistant for a restaurant's Order Management system.
You MUST call the provided tools to fetch real order data. Never make up or guess any data.

DATA SCHEMA (for interpreting tool results):
- order.status: "1" = New/Pending, "2" = Approved, "3" = Cancelled
- order.kitchenStatus: "new" | "preparing" | "ready" | "completed"
- order.orderType: "dine_in" | "takeaway" | "delivery"
- order.total: may be null if bill hasn't been generated yet
- "Completed" orders = status "2" AND kitchenStatus "completed"
- "Pending" orders = status "1"
- "Cancelled" orders = status "3"

RESPONSE FORMAT:
- Provide natural, concise, and human-friendly answers.
- NEVER output Markdown syntax (like **, -, or raw structured text).
- For simple questions, give a direct 1-2 sentence answer.
- For order details, write clean readable sentences (e.g. "Rahul Patel’s order is #DCE4E4 — ₹840, 3 items, Dine-in at Table 4, Completed.").
- Avoid unnecessary explanations, disclaimers, or repeating information.
- Use ₹ for currency.
- If total is null, say "amount not recorded" naturally.
- Only say "not answerable" if the user asks something completely unrelated to the restaurant.
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: question }
  ];

  let currentMessages = [...messages];
  
  for (let i = 0; i < 4; i++) {
    onProgress?.('Thinking...');
    
    const { data } = await apiClient.post('/chat', {
      messages: currentMessages,
      tools: TOOLS
    });
    
    const responseMsg = data.message;
    currentMessages.push(responseMsg);

    if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      onProgress?.('Searching orders...');
      for (const toolCall of responseMsg.tool_calls) {
        if (toolCall.type === 'function') {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments);
          const toolResult = await executeTool(fnName, fnArgs);
          
          currentMessages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: fnName,
            content: toolResult
          });
        }
      }
    } else {
      break;
    }
  }

  const finalMessage = currentMessages[currentMessages.length - 1];
  return {
    reply: finalMessage.content || 'I could not find an answer.',
    newHistory: currentMessages.filter(m => m.role !== 'system')
  };
}
