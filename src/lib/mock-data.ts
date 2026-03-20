import type { Category, MenuItem } from './types';

export const mockCategories: Category[] = [
  { id: 'cat-1', name: "Uyg'ur taomlar", display_order: 1, icon: '🍜', created_at: '' },
  { id: 'cat-2', name: 'Milliy taomlar', display_order: 2, icon: '🍚', created_at: '' },
  { id: 'cat-3', name: 'Salatlar', display_order: 3, icon: '🥗', created_at: '' },
  { id: 'cat-4', name: 'Shirinliklar', display_order: 4, icon: '🍰', created_at: '' },
];

export const mockItems: MenuItem[] = [
  // Uyg'ur taomlar
  {
    id: '1', category_id: 'cat-1', name: "Lag'mon",
    description: "Qo'lda cho'zilgan lag'mon, mol go'shtli va sabzavotli",
    price: 42000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: true, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-1', name: "Uyg'ur taomlar", display_order: 1, icon: '🍜', created_at: '' },
  },
  {
    id: '2', category_id: 'cat-1', name: 'Chuchvara',
    description: "Uyg'ur uslubidagi chuchvara, bulyon bilan",
    price: 35000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-1', name: "Uyg'ur taomlar", display_order: 1, icon: '🍜', created_at: '' },
  },
  {
    id: '3', category_id: 'cat-1', name: 'Manti',
    description: "Uyg'ur mantisi, qo'y go'shti va piyoz bilan",
    price: 38000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: true, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-1', name: "Uyg'ur taomlar", display_order: 1, icon: '🍜', created_at: '' },
  },
  {
    id: '4', category_id: 'cat-1', name: "Go'shnan",
    description: "Uyg'ur go'shnani, tandirda pishirilgan",
    price: 25000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-1', name: "Uyg'ur taomlar", display_order: 1, icon: '🍜', created_at: '' },
  },
  // Milliy taomlar
  {
    id: '5', category_id: 'cat-2', name: 'Toshkent Palovi',
    description: "An'anaviy toshkent palovi, qo'y go'shti, sabzi, ziravori bilan",
    price: 55000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: true, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-2', name: 'Milliy taomlar', display_order: 2, icon: '🍚', created_at: '' },
  },
  {
    id: '6', category_id: 'cat-2', name: 'Tandir Kabob',
    description: "Tandirda pishirilgan qo'y go'shti, yumshoq va mazali",
    price: 75000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: true, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-2', name: 'Milliy taomlar', display_order: 2, icon: '🍚', created_at: '' },
  },
  {
    id: '7', category_id: 'cat-2', name: 'Tandirda Somsa',
    description: "Tandirda pishirilgan somsa, qo'y go'shti bilan",
    price: 12000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-2', name: 'Milliy taomlar', display_order: 2, icon: '🍚', created_at: '' },
  },
  {
    id: '8', category_id: 'cat-2', name: "Sho'rva",
    description: "An'anaviy qo'y go'shtli sho'rva, sabzavotlar bilan",
    price: 40000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-2', name: 'Milliy taomlar', display_order: 2, icon: '🍚', created_at: '' },
  },
  {
    id: '9', category_id: 'cat-2', name: 'Norin',
    description: "Yupqa kesimli xamir va qaynatilgan go'sht",
    price: 48000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-2', name: 'Milliy taomlar', display_order: 2, icon: '🍚', created_at: '' },
  },
  // Salatlar
  {
    id: '10', category_id: 'cat-3', name: 'Achichuk',
    description: "Pomidor, piyoz va qalampir salati",
    price: 18000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-3', name: 'Salatlar', display_order: 3, icon: '🥗', created_at: '' },
  },
  {
    id: '11', category_id: 'cat-3', name: 'Shakarob',
    description: "Pomidor salati, piyoz va o't bilan",
    price: 15000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-3', name: 'Salatlar', display_order: 3, icon: '🥗', created_at: '' },
  },
  // Shirinliklar
  {
    id: '12', category_id: 'cat-4', name: 'Chak-chak',
    description: "An'anaviy shirin taom, asal bilan",
    price: 20000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-4', name: 'Shirinliklar', display_order: 4, icon: '🍰', created_at: '' },
  },
  {
    id: '13', category_id: 'cat-4', name: 'Halvaitar',
    description: "An'anaviy o'zbek halvaitari, yog' va un bilan",
    price: 15000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-4', name: 'Shirinliklar', display_order: 4, icon: '🍰', created_at: '' },
  },
  {
    id: '14', category_id: 'cat-4', name: "Nisholda",
    description: "Oq ko'pikli shirin taom, bahor uchun maxsus",
    price: 18000, image_url: null, model_usdz_url: null, model_glb_url: null,
    model_status: 'none', is_featured: false, is_available: true, created_at: '', updated_at: '',
    categories: { id: 'cat-4', name: 'Shirinliklar', display_order: 4, icon: '🍰', created_at: '' },
  },
];
