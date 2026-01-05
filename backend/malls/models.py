from django.db import models

class Mall(models.Model):
    """Model to represent different malls listed in the application"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to='mall_images/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def image_url(self):
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        return ""
    
    def __str__(self):
        return self.name
    

class Offer(models.Model):
    mall = models.ForeignKey(Mall, on_delete=models.CASCADE, related_name="offers")
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to="offers/")
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title
