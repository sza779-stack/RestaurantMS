import React from 'react';
import { BookOpen, ChevronRight, Utensils, Grid, Gift, Tag, Layers, Link, Monitor, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const InstructionsTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-orange-100 rounded-[5px]">
          <BookOpen className="text-orange-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Menu Management Guide</h2>
          <p className="text-sm text-gray-600">Step-by-step instructions to configure your restaurant menu</p>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-orange-50 border border-orange-200 rounded-[5px] p-5">
        <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertCircle size={16} />
          Quick Start — Recommended Order
        </h3>
        <div className="flex items-center flex-wrap gap-2 text-sm font-medium text-orange-700">
          <span className="bg-white px-3 py-1.5 rounded-[5px] border border-orange-200">1. Categories</span>
          <ArrowRight size={14} className="text-orange-400" />
          <span className="bg-white px-3 py-1.5 rounded-[5px] border border-orange-200">2. Products</span>
          <ArrowRight size={14} className="text-orange-400" />
          <span className="bg-white px-3 py-1.5 rounded-[5px] border border-orange-200">3. Modifiers</span>
          <ArrowRight size={14} className="text-orange-400" />
          <span className="bg-white px-3 py-1.5 rounded-[5px] border border-orange-200">4. Link to Products</span>
          <ArrowRight size={14} className="text-orange-400" />
          <span className="bg-white px-3 py-1.5 rounded-[5px] border border-orange-200">5. Combos</span>
        </div>
      </div>

      {/* Step 1: Categories */}
      <StepCard
        stepNumber={1}
        title="Create Categories"
        icon={Grid}
        color="blue"
        steps={[
          'Go to the **Categories** tab',
          'Click **"+ Add Category"** button',
          'Enter a category name (e.g., "Pizza", "Subs", "Wings", "Drinks")',
          'Set the sort order to control display position on POS',
          'Toggle **Active** to make it visible on POS',
          'Click **Save** to create',
        ]}
        tip="Categories group your products on the POS screen. Create them first so you can assign products to them."
      />

      {/* Step 2: Products */}
      <StepCard
        stepNumber={2}
        title="Add Products"
        icon={Utensils}
        color="orange"
        steps={[
          'Go to the **Products** tab',
          'Click **"+ Add Product"** button',
          'Fill in: **Product Name**, **Category**, **Product Type**, **Price**',
          'For customizable items (like Build Your Own Pizza), set Type to **"Custom BYO"**',
          'For signature items, set Type to **"Signature Pizza"**, **"Sub/Sandwich"**, etc.',
          'Click **Save Product** to create',
        ]}
        tip='Product Type determines how the POS handles the item. "Custom BYO" enables the full pizza builder interface. "Standalone" is for simple items like drinks or sides.'
      />

      {/* Step 3: Modifiers */}
      <StepCard
        stepNumber={3}
        title="Set Up Modifier Groups & Add-Ons"
        icon={Layers}
        color="purple"
        steps={[
          'Go to the **Modifiers** tab',
          'Click **"+ Add Modifier Group"** to create a group (e.g., "Crust Type", "Sauce")',
          'Set **Group Name** — use descriptive names like "Crust", "Sauce", "Cheese", "Meat", "Veggie"',
          'Choose **Selection Type**: Single Select (pick one) or Multi Select (pick many)',
          'Set **Min/Max Selections** (e.g., Crust: min 1, max 1; Toppings: min 0, max 10)',
          'On the right panel, click **"+ Quick Create New Add-On"** to create individual options',
          'Enter the add-on name, price, and type, then click Create',
          'Click the **+** button next to each add-on to add it to the current group',
          'Click **Create Group** to save',
        ]}
        tip="Add-ons are the individual items (like 'Pepperoni' or 'Hand Tossed'). Modifier Groups are containers that hold related add-ons together. An add-on can belong to multiple groups."
      />

      {/* Step 4: Link Modifiers to Products */}
      <StepCard
        stepNumber={4}
        title="Link Modifier Groups to Products"
        icon={Link}
        color="green"
        steps={[
          'Go to the **Products** tab',
          'Click the **edit** (pencil) icon on any product',
          'Scroll down to the **"Modifier Groups"** section',
          'Toggle **ON** the modifier groups you want linked to this product',
          'When you toggle ON, individual add-ons from that group appear as checkboxes',
          'Check the add-ons that should be **selected by default** for this product',
          'Click **Update Product** to save the links',
        ]}
        tip="This is the critical step! Your modifier groups won't appear on the POS until they are linked to a product. For Build Your Own Pizza, link all 5 groups: Crust Type, Sauce, Cheese, Meat Toppings, Veggie Toppings."
      />

      {/* Step 5: Combos */}
      <StepCard
        stepNumber={5}
        title="Create Combo Deals"
        icon={Tag}
        color="pink"
        steps={[
          'Go to the **Combos** tab and click **"Create Combo"**',
          'Enter **Combo Name** (e.g., "Family Feast", "Lunch Special #1")',
          'Click **"Add Selection Line"** for each item in the combo',
          'For each line, set **Selection Type**: **Fixed Product** (specific item) or **Choose from Category** (customer picks)',
          'Select a **Product** from the grouped dropdown — products show their price, grouped by category',
          'The **Smart Price Suggestion** banner auto-calculates: items total and a suggested 12% discount price',
          'Click **"Apply Prices"** to auto-fill both **Combo Price** and **Retail Value** (or set manually)',
          'The **Retail Value** is what items cost separately — used to show customer savings (e.g., "Save $5.00!")',
          'Set **Availability Schedule**: date range and/or specific days of the week (leave empty = always available)',
          'Toggle **Active on POS** and **Featured Deal** at the bottom',
          'Click **Publish New Combo** to save',
        ]}
        tip="The smart pricing system suggests a combo price by calculating individual item prices minus ~12% discount. You can always override this. Use 'Featured Deal' to highlight combos on screens."
      />

      {/* Step 5b: Combo Display & Timing */}
      <div className="bg-white border border-gray-200 rounded-[5px] overflow-hidden shadow-sm">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-pink-600 text-white text-sm font-bold flex items-center justify-center">5b</span>
            <Monitor size={20} className="text-pink-700" />
            <h3 className="text-lg font-bold text-gray-900">Combo Display & Timing on Screens</h3>
          </div>
          <div className="ml-11 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-[5px] border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-1">📺 POS Screen</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Combos appear in the **search bar** and **Combos category**</li>
                  <li>• Active combos show immediately after creation</li>
                  <li>• Featured combos display with a highlight badge</li>
                  <li>• Cashiers can search combos by name (Ctrl+K)</li>
                </ul>
              </div>
              <div className="p-3 bg-purple-50 rounded-[5px] border border-purple-100">
                <h4 className="text-sm font-bold text-purple-800 mb-1">🖥️ Online & Walk-in</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Combos auto-sync to online and walk-in ordering</li>
                  <li>• Customers see savings vs retail value</li>
                  <li>• Use **availableDays** for lunch-only or weekend specials</li>
                  <li>• Set **availableFrom/To** for limited-time promotions</li>
                </ul>
              </div>
              <div className="p-3 bg-green-50 rounded-[5px] border border-green-100">
                <h4 className="text-sm font-bold text-green-800 mb-1">⏰ Timing Best Practices</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• **Lunch Specials**: Set Mon–Fri, 11am–2pm</li>
                  <li>• **Weekend Deals**: Set Sat–Sun only</li>
                  <li>• **Holiday Promos**: Use date range (e.g., Dec 20–Jan 2)</li>
                  <li>• **Happy Hour**: Schedule specific time windows</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-[5px]">
              <p className="text-xs text-pink-800 font-medium">
                <strong>💡 Tip:</strong> Leaving all scheduling fields empty means the combo is available 24/7. Use the day selector to create recurring weekly specials without setting exact dates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 6: POS Integration */}
      <StepCard
        stepNumber={6}
        title="POS & Menu Visibility"
        icon={Monitor}
        color="indigo"
        steps={[
          'At the top of Menu Management, you see **Restaurant Menu Groups for POS**',
          'Check or uncheck cuisine groups (Fast Food, Desi, Gyro) to control what appears on POS',
          'Click **"Save POS Menu Visibility"** to apply changes',
          'Open your POS screen to verify products, modifiers, and combos appear correctly',
          'Products marked as **Active** will show on POS; **Inactive** products are hidden',
        ]}
        tip="Changes to menu visibility take effect immediately on the POS. Test by opening the POS in another browser tab."
      />

      {/* Troubleshooting */}
      <div className="bg-gray-50 border border-gray-200 rounded-[5px] p-5 mt-8">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertCircle size={16} className="text-gray-500" />
          Common Issues & Solutions
        </h3>
        <div className="space-y-3">
          <TroubleshootItem
            problem="Modifier groups don't appear on POS"
            solution="Make sure the groups are linked to the product (Step 4). Go to Products → Edit → toggle the modifier group ON."
          />
          <TroubleshootItem
            problem="Product shows 'fallback' options instead of your custom ones"
            solution="The product needs modifier groups linked via the Edit Product modal. Without links, the POS shows default/fallback data."
          />
          <TroubleshootItem
            problem="Can't save changes on Edit Modal"
            solution="Ensure all required fields (Name, Price) are filled. If the error persists, check the browser console for API errors."
          />
          <TroubleshootItem
            problem="New add-on not appearing in the modifier group"
            solution='After creating an add-on via "Quick Create", click the + button next to it to add it to the current group.'
          />
          <TroubleshootItem
            problem="POS menu is empty"
            solution="Check that at least one Menu Group is enabled at the top of Menu Management, and that products have Active status."
          />
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────

interface StepCardProps {
  stepNumber: number;
  title: string;
  icon: React.FC<any>;
  color: string;
  steps: string[];
  tip: string;
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; tipBg: string; tipText: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-600',   tipBg: 'bg-blue-50',   tipText: 'text-blue-800' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-600', tipBg: 'bg-orange-50', tipText: 'text-orange-800' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600', tipBg: 'bg-purple-50', tipText: 'text-purple-800' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-600',  tipBg: 'bg-green-50',  tipText: 'text-green-800' },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-700',   badge: 'bg-pink-600',   tipBg: 'bg-pink-50',   tipText: 'text-pink-800' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-600', tipBg: 'bg-indigo-50', tipText: 'text-indigo-800' },
};

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, icon: Icon, color, steps, tip }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-white border border-gray-200 rounded-[5px] overflow-hidden shadow-sm`}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className={`w-8 h-8 rounded-full ${c.badge} text-white text-sm font-bold flex items-center justify-center`}>
            {stepNumber}
          </span>
          <Icon size={20} className={c.text} />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <ol className="space-y-2.5 ml-11">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <ChevronRight size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900">$1</strong>') }} />
            </li>
          ))}
        </ol>
        {tip && (
          <div className={`mt-4 ml-11 p-3 ${c.tipBg} ${c.border} border rounded-[5px]`}>
            <p className={`text-xs ${c.tipText} font-medium`}>
              <strong>💡 Tip:</strong> {tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const TroubleshootItem: React.FC<{ problem: string; solution: string }> = ({ problem, solution }) => (
  <div className="flex items-start gap-3 p-3 bg-white rounded-[5px] border border-gray-100">
    <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-sm font-semibold text-gray-900">{problem}</p>
      <p className="text-xs text-gray-600 mt-0.5">{solution}</p>
    </div>
  </div>
);

export default InstructionsTab;
