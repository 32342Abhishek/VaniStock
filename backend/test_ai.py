import asyncio
from app.services.ai_service import ai_provider

async def test():
    p = ai_provider()
    res = await p.parse_inventory_command('add 5 bags of rice')
    print(res)

if __name__ == "__main__":
    asyncio.run(test())
