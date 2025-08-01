import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const statistics = await UserService.getStatistics(params.id)
    
    if (!statistics) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    )
  }
}
