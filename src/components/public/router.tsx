'use client'

import { useApp } from '@/lib/store'
import { PublicHome } from './home'
import { PublicProducts } from './products'
import { PublicProductDetail } from './product-detail'
import { PublicAbout } from './about'
import { PublicWholesale } from './wholesale'
import { PublicBlog } from './blog'
import { PublicBlogPost } from './blog-post'
import { PublicContact } from './contact'
import { PublicLogin } from './login'

export function PublicRouter() {
  const { route } = useApp()
  if (route.view !== 'public') return null

  switch (route.page) {
    case 'home':
      return <PublicHome />
    case 'products':
      return <PublicProducts categorySlug={route.categorySlug} />
    case 'product':
      return <PublicProductDetail categorySlug={route.categorySlug} productSlug={route.productSlug} />
    case 'about':
      return <PublicAbout />
    case 'wholesale':
      return <PublicWholesale />
    case 'blog':
      return <PublicBlog />
    case 'blog-post':
      return <PublicBlogPost slug={route.slug} />
    case 'contact':
      return <PublicContact />
    case 'login':
      return <PublicLogin />
    default:
      return <PublicHome />
  }
}
