from django.core.management.base import BaseCommand
from QuickMedsApp.models import Category, Product
from decimal import Decimal

class Command(BaseCommand):
    help = 'Add sample products to the database'

    def handle(self, *args, **kwargs):
        # Create categories
        categories = {
            'Baby Care': [
                {
                    'name': 'Johnson\'s Baby Powder',
                    'price': Decimal('199.00'),
                    'original_price': Decimal('249.00'),
                    'description': 'Gentle baby powder for daily use'
                },
                {
                    'name': 'Himalaya Baby Lotion',
                    'price': Decimal('175.00'),
                    'original_price': Decimal('199.00'),
                    'description': 'Moisturizing baby lotion with natural ingredients'
                }
            ],
            'Wellness & Nutrition': [
                {
                    'name': 'Ensure Protein Powder',
                    'price': Decimal('599.00'),
                    'original_price': Decimal('699.00'),
                    'description': 'Complete nutrition for adults'
                },
                {
                    'name': 'Vitamin C Tablets',
                    'price': Decimal('299.00'),
                    'original_price': Decimal('349.00'),
                    'description': 'Immunity booster supplements'
                }
            ],
            'Personal Care & Hygiene': [
                {
                    'name': 'Dettol Hand Sanitizer',
                    'price': Decimal('99.00'),
                    'original_price': Decimal('120.00'),
                    'description': 'Kills 99.9% of germs'
                },
                {
                    'name': 'Colgate Toothpaste',
                    'price': Decimal('89.00'),
                    'original_price': Decimal('99.00'),
                    'description': 'Advanced cavity protection'
                }
            ],
            'Pain Reliever': [
                {
                    'name': 'Ibuprofen Tablets',
                    'price': Decimal('45.00'),
                    'original_price': Decimal('50.00'),
                    'description': 'Fast pain relief'
                },
                {
                    'name': 'Pain Relief Gel',
                    'price': Decimal('149.00'),
                    'original_price': Decimal('179.00'),
                    'description': 'Topical pain relief'
                }
            ],
            'Healthcare & First Aid': [
                {
                    'name': 'First Aid Kit',
                    'price': Decimal('499.00'),
                    'original_price': Decimal('599.00'),
                    'description': 'Complete emergency kit'
                },
                {
                    'name': 'Digital Thermometer',
                    'price': Decimal('299.00'),
                    'original_price': Decimal('349.00'),
                    'description': 'Accurate temperature measurement'
                }
            ],
            'OTC Medicines': [
                {
                    'name': 'Cough Syrup',
                    'price': Decimal('89.00'),
                    'original_price': Decimal('99.00'),
                    'description': 'Effective cough relief'
                },
                {
                    'name': 'Antacid Tablets',
                    'price': Decimal('45.00'),
                    'original_price': Decimal('50.00'),
                    'description': 'Quick acid reflux relief'
                }
            ]
        }

        for category_name, products in categories.items():
            category, created = Category.objects.get_or_create(name=category_name)
            self.stdout.write(f'{"Created" if created else "Found"} category: {category_name}')

            for product_data in products:
                product, created = Product.objects.get_or_create(
                    name=product_data['name'],
                    category=category,
                    defaults={
                        'price': product_data['price'],
                        'original_price': product_data['original_price'],
                        'description': product_data['description']
                    }
                )
                self.stdout.write(f'{"Created" if created else "Found"} product: {product.name}') 